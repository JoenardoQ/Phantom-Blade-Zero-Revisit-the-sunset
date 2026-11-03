const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const events=[],calls=[];
let now=0;
const pc={},pawn={},player={Stop(){calls.push('stop');}},actor={K2_DestroyActor(){calls.push('destroy');}};
const UE={KismetSystemLibrary:{IsValid:x=>!!x},CommonUIExtensions:{
    SuspendInputForPlayer:(p,reason)=>{assert.equal(p,pc);calls.push('lock');return 'owned-token';},
    ResumeInputForPlayer:(p,token)=>{assert.equal(p,pc);assert.equal(token,'owned-token');calls.push('release');}},
    GameplayStatics:{GetPlayerCharacter:()=>pawn,GetCurrentLevelName:()=> 'PBZ_Zhengdaodaying_WP',GetTimeSeconds:()=>0}};
const context={exports:{},require:name=>name==='ue'?UE:name==='cpp'?{}:name==='puerts'?{}:
    name==='./DreamBodyText'?{registerItemText(){}}:name==='./DreamBodyDebug'?{event:(e)=>events.push(e),state:()=>({})}:{default:{}},
    console,Date:{now:()=>now}};
vm.runInNewContext(fs.readFileSync(__dirname+'/DreamBody.js','utf8')+`
exports.test={lockMovieInput,releaseMovieInput,stopSequence,run(s){active=s;tick(s);}};
applyMovieIdle=()=>{};fail=(s,error)=>{exports.failure=error;stopSequence(s);};`,context);
const api=context.exports.test,s={pc,pawn,player,sequenceActor:actor,phase:'collapse',startedAt:0,duration:14.36,wallDeadline:45000};
api.lockMovieInput(s);api.lockMovieInput(s);
assert.deepEqual(calls,['lock'],'Acquire only one scoped token');
now=46000;api.run(s);
assert.match(String(context.exports.failure),/wall-clock/,'A frozen game clock must not hang forever');
assert.deepEqual(calls,['lock','stop','destroy','release']);
api.releaseMovieInput(s);assert.equal(calls.filter(x=>x==='release').length,1,'Release exactly once on repeated cleanup');
console.log('PASS: scoped input suspension, balanced cleanup and timeout while game time is frozen.');
