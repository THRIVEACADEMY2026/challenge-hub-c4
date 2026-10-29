(function(){
"use strict";

var CAS_ORIGIN="https://id.clientattractionsummit.com";
var REQUEST_TIMEOUT_MS=8000;
var MAX_WAIT_MS=90000;
var deadline=null;
var STORAGE_KEY="thriveChallengeHubEntryContactId";
var MAX_CONTACT_ID_LENGTH=128;
var MAX_AUTOMATIC_ATTEMPTS=12;
var MIN_RETRY_MS=750;
var MAX_RETRY_MS=10000;
var SLOW_RETRY_MS=8000;
var DEFAULT_DELAYS=[1000,2000,3000,5000,8000];
var attempt=0;
var stopped=false;
var inFlight=false;
var timer=null;
var waitingForVisibility=false;
var contactId=null;
var csrfToken=null;

var title=document.getElementById("entryTitle");
var message=document.getElementById("entryMessage");
var pulse=document.getElementById("entryPulse");
var actions=document.getElementById("entryActions");
var retry=document.getElementById("entryRetry");
var card=document.querySelector(".card");

/* ---------------------------------------------------------------------------
   Report where this handoff ended up. Every paid lead arrives through here,
   and until now it reported nothing at all: a lead who never got past this
   screen left no trace, so nobody could tell whether the ad spend was landing
   people in the Hub or stranding them. Ella, 28 Oct.

   Same sheet as the Hub's own sign-in log, so one tab answers "who got in and
   who did not" for both the automatic and the manual routes. Fire and forget,
   wrapped, once per outcome: logging must never be the reason a handoff
   fails, and this page gains no new dependency by doing it.
   --------------------------------------------------------------------------- */
var LOG_ENDPOINT = window.THRIVE_HUB_LOG_ENDPOINT ||
  "https://script.google.com/macros/s/AKfycbwsDmIYQGCyRB9QU_afeS2eKjwn_QTAnv2tJzMYUnCDuCLx_VH_xPyQnSDod15Nt4tDlA/exec";
var startedAt = Date.now();
var reported = false;
function reportEntry(outcome, status){
  if(reported) return;
  reported = true;
  try{
    if(!LOG_ENDPOINT) return;
    fetch(LOG_ENDPOINT,{method:"POST",mode:"cors",keepalive:true,
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify({
        challenge:"c1-nov-2026",
        outcome:outcome,
        /* The correlation id this page already holds. Not proof of identity,
           but it is what a Concierge can look up when someone says they could
           not get in. No address is read or sent from here. */
        contact: contactId || "",
        status: status || 0,
        attempt: attempt,
        waited: Math.round((Date.now()-startedAt)/1000),
        round:"", tag:"",
        screen:(window.innerWidth||0)+"x"+(window.innerHeight||0),
        agent:(navigator.userAgent||"").slice(0,180),
        page:"/entry"
      })}).catch(function(){});
  }catch(e){}
}

function validContactId(value){
  return typeof value==="string"&&value.length>0&&value.length<=MAX_CONTACT_ID_LENGTH&&
    value===value.trim()&&!/\s/.test(value);
}

function captureCorrelation(){
  var url=new URL(window.location.href);
  var supplied=url.searchParams.get("contact_id");
  if(url.searchParams.has("contact_id")&&!validContactId(supplied)){
    try{sessionStorage.removeItem(STORAGE_KEY);}catch(error){}
    url.searchParams.delete("contact_id");
    history.replaceState(null,"",url.pathname+url.search+url.hash);
    return null;
  }
  if(validContactId(supplied)){
    contactId=supplied;
    try{sessionStorage.setItem(STORAGE_KEY,contactId);}catch(error){}
    url.searchParams.delete("contact_id");
    history.replaceState(null,"",url.pathname+(url.search?url.search:"")+url.hash);
    return contactId;
  }
  try{
    var stored=sessionStorage.getItem(STORAGE_KEY);
    if(validContactId(stored)) contactId=stored;
  }catch(error){}
  return contactId;
}

var ENTRY_OUTCOMES={
  IDENTITY_CONFLICT:"entry_other_account",
  AUTH_UNAVAILABLE:"entry_session_lost",
  RECOVERABLE_ERROR:"entry_still_waiting",
  LONG_WAIT:"entry_gave_up"
};
function setState(state){
  card.setAttribute("data-entry-state",state);
  if(ENTRY_OUTCOMES[state]) reportEntry(ENTRY_OUTCOMES[state], 0);
  if(state==="INITIALIZING"||state==="PROVISIONING"){
    title.textContent="Setting up your Challenge Hub...";
    message.textContent="Your registration was received. We’re preparing your access now.";
    pulse.hidden=false;actions.hidden=true;card.setAttribute("aria-busy","true");return;
  }
  if(state==="IDENTITY_CONFLICT"){
    title.textContent="Let’s confirm the right account";
    message.textContent="This browser is already connected to another account. Open the Hub to sign out or switch accounts before continuing.";
  }else if(state==="AUTH_UNAVAILABLE"){
    title.textContent="Sign in to continue";
    message.textContent="We couldn’t restore this browser’s signup session. You can continue with the Hub’s normal sign-in option.";
  }else if(state==="RECOVERABLE_ERROR"){
    title.textContent="We’re still preparing your access";
    message.textContent="Your registration was received, but access is taking longer than expected. Please retry in a moment.";
  }else{
    title.textContent="Your access is still being prepared";
    message.textContent="Your registration was received. Please retry shortly, or use the Hub’s normal sign-in option once your access is ready.";
  }
  pulse.hidden=true;actions.hidden=false;card.setAttribute("aria-busy","false");
}

function stop(){
  stopped=true;
  if(timer!==null){clearTimeout(timer);timer=null;}
  if(deadline!==null){clearTimeout(deadline);deadline=null;}
}

function boundedDelay(serverDelay){
  var fallback=attempt<DEFAULT_DELAYS.length?DEFAULT_DELAYS[attempt]:SLOW_RETRY_MS;
  var base=Number.isInteger(serverDelay)?serverDelay:fallback;
  base=Math.max(MIN_RETRY_MS,Math.min(MAX_RETRY_MS,base));
  return Math.round(base*(.85+Math.random()*.3));
}

function schedule(serverDelay){
  if(stopped) return;
  if(attempt>=MAX_AUTOMATIC_ATTEMPTS){stop();setState("LONG_WAIT");return;}
  var delay=boundedDelay(serverDelay);
  timer=setTimeout(function(){timer=null;checkReadiness();},delay);
}

async function request(url,options){
  var controller=new AbortController();
  var timeout=setTimeout(function(){controller.abort();},REQUEST_TIMEOUT_MS);
  try{
    var response=await fetch(url,Object.assign({},options,{signal:controller.signal}));
    var result=await response.json().catch(function(){return {};});
    return {response:response,result:result};
  }finally{clearTimeout(timeout);}
}

async function refreshSession(){
  var reply=await request(CAS_ORIGIN+"/browser/challenge-hub/session",{
    method:"GET",credentials:"include",headers:{"Accept":"application/json"}
  });
  var response=reply.response;
  var result=reply.result;
  if(stopped) return;
  if(!response.ok||typeof result.csrf_token!=="string") throw new Error("AUTH_UNAVAILABLE");
  csrfToken=result.csrf_token;
  return result.authorized===true;
}

async function checkReadiness(){
  if(stopped||inFlight) return;
  if(document.visibilityState==="hidden"){
    waitingForVisibility=true;
    return;
  }
  inFlight=true;
  setState(attempt===0?"INITIALIZING":"PROVISIONING");
  try{
    var authorized=false;
    if(!csrfToken) authorized=await refreshSession();
    if(stopped) return;
    if(!contactId){
      stop();
      if(authorized) window.location.replace("/");
      else setState("AUTH_UNAVAILABLE");
      return;
    }
    var reply=await request(CAS_ORIGIN+"/browser/challenge-hub/readiness",{
      method:"POST",credentials:"include",
      headers:{"Accept":"application/json","Content-Type":"application/json","X-CAS-CSRF":csrfToken},
      body:JSON.stringify({contact_id:contactId})
    });
    var response=reply.response;
    var result=reply.result;
    if(stopped) return;
    if(response.ok&&result.status==="READY"&&result.ready===true){
      stop();
      reportEntry("entry_in", response.status);
      window.location.replace("/");
      return;
    }
    if(response.status===409&&result.status==="IDENTITY_CONFLICT"){
      stop();setState("IDENTITY_CONFLICT");return;
    }
    if(response.status===401||response.status===403){
      stop();setState("AUTH_UNAVAILABLE");return;
    }
    attempt+=1;
    if(result.status==="PROVISIONING"){
      schedule(result.retry_after_ms);return;
    }
    if(result.status==="RECOVERABLE_ERROR"||response.status>=500){
      csrfToken=null;
      schedule(result.retry_after_ms);return;
    }
    stop();setState("RECOVERABLE_ERROR");
  }catch(error){
    if(stopped) return;
    attempt+=1;csrfToken=null;
    if(attempt>=MAX_AUTOMATIC_ATTEMPTS){stop();setState("RECOVERABLE_ERROR");}
    else schedule();
  }finally{
    inFlight=false;
  }
}

function start(){
  if(inFlight) return;
  stop();
  stopped=false;attempt=0;csrfToken=null;waitingForVisibility=false;
  deadline=setTimeout(function(){stop();setState("RECOVERABLE_ERROR");},MAX_WAIT_MS);
  checkReadiness();
}

document.addEventListener("visibilitychange",function(){
  if(document.visibilityState!=="hidden"&&waitingForVisibility&&!stopped){
    waitingForVisibility=false;checkReadiness();
  }
});

retry.addEventListener("click",start);
captureCorrelation();
start();

window.ChallengeHubEntry={start:start};
})();
