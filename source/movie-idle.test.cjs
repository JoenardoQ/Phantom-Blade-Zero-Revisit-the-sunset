// Behaviour checks for the cinematic-only animation override. Run: node movie-idle.test.cjs
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/DreamBody.js','utf8');
function fixture(){
    const calls=[], idle={}, playerMesh={}, pawn={Mesh:playerMesh};
    const playerBinding={Guid:{A:99},SequenceID:0,ResolveParentIndex:-1};
    let available=true,actors=[];
    const UE={
        Object:{Load:path=>{calls.push(['load',path]);return available?idle:null;}},
        KismetSystemLibrary:{IsValid:x=>!!x&&!x.invalid},
        Guid:class {}, Actor:{}, NewArray:()=>[],
        SkeletalMeshComponent:{StaticClass:()=> 'SkeletalMeshComponent'},
        EAnimationMode:{AnimationSingleNode:1},
        EVisibilityBasedAnimTickOption:{AlwaysTickPoseAndRefreshBones:0}
    };
    const context={exports:{},require:name=>name==='ue'?UE:name==='cpp'?{}:name==='puerts'?{}:
        name==='./DreamBodyText'?{registerItemText(){}}:name==='./DreamBodyDebug'?{event(){},state(){return {};},errorDetails(){return {};},name(){return 'mock';}}:{default:{}},console};
    vm.runInNewContext(source+'\nexports.test={prepareMovieIdle,applyMovieIdle,stopSequence};',context);
    const s={pawn,sequenceActor:{FindNamedBinding:()=>({...playerBinding}),
        SetBinding:(...args)=>calls.push(['binding',...args]),ResetBinding:b=>calls.push(['reset',b]),K2_DestroyActor:()=>calls.push(['destroy'])},
        player:{GetBoundObjects:()=>({Num:()=>actors.length,Get:i=>actors[i]}),Stop:()=>calls.push(['stop'])}};
    return {calls,idle,pawn,playerMesh,playerBinding,s,api:context.exports.test,
        assets:v=>available=v,actors:v=>actors=v,
        actor(){const mesh={mode:0,instance:{},playing:false,
                GetAnimationMode:()=>mesh.mode,GetAnimInstance:()=>mesh.instance,IsPlaying:()=>mesh.playing,
                PlayAnimation:(...a)=>{calls.push(['play',mesh,...a]);mesh.mode=1;mesh.instance={CurrentAsset:a[0]};mesh.playing=true;}};
            return {mesh,GetComponentByClass:()=>mesh};}};
}
{
    const f=fixture();f.api.prepareMovieIdle(f.s);
    assert.match(f.calls[0][1],/Hero_Hun\/Animation\/Locomotion\/Unarmed\/Idle\/Hun_Unarmed_Idle_Loop/);
    const binding=f.calls.find(c=>c[0]==='binding');
    assert.equal(binding[1].Guid.A,0x0112370F);
    assert.equal(binding[1].SequenceID,0);assert.equal(binding[1].ResolveParentIndex,-1);
    assert.equal(binding[2].length,0);assert.equal(binding[3],false);
    assert.equal(f.playerBinding.Guid.A,99,'The Player binding must remain unchanged');
}
{
    const f=fixture();f.api.prepareMovieIdle(f.s);
    f.api.applyMovieIdle(f.s);assert.equal(f.calls.filter(c=>c[0]==='play').length,0);
    const first=f.actor();f.actors([f.pawn,{GetComponentByClass:()=>f.playerMesh},first]);
    f.api.applyMovieIdle(f.s);f.api.applyMovieIdle(f.s);
    let played=f.calls.filter(c=>c[0]==='play');
    assert.equal(played.length,1,'Do not restart idle each polling tick');
    assert.equal(played[0][1],first.mesh);assert.equal(played[0][2],f.idle);assert.equal(played[0][3],true);
    assert.deepEqual(f.playerMesh,{},'Do not change the real player mesh');
    first.mesh.mode=0;first.mesh.instance={};first.mesh.playing=false;
    f.api.applyMovieIdle(f.s);
    assert.equal(f.calls.filter(c=>c[0]==='play').length,2,'Repair an animation instance replaced after forward playback starts');
    f.api.applyMovieIdle(f.s);
    assert.equal(f.calls.filter(c=>c[0]==='play').length,2,'Keep recovered idle running without restarting');
    first.mesh.invalid=true;
    const replacement=f.actor();f.actors([replacement]);f.api.applyMovieIdle(f.s);
    assert.equal(f.calls.filter(c=>c[0]==='play').length,3,'Handle a respawned cinematic actor');
    f.api.stopSequence(f.s);
    assert.equal(f.s.movieMesh,undefined);assert.equal(f.s.movieIdle,undefined);
    assert.deepEqual(f.playerMesh,{});
}
{
    const f=fixture();f.assets(false);
    assert.doesNotThrow(()=>f.api.prepareMovieIdle(f.s));
    assert.equal(f.s.movieIdle,undefined);
    assert.equal(f.calls.filter(c=>c[0]==='binding').length,0,'Fail before any binding change');
}
{
    const f=fixture();f.api.prepareMovieIdle(f.s);
    const broken=f.actor();broken.mesh.PlayAnimation=()=>{throw Error('incompatible animation');};f.actors([broken]);
    assert.doesNotThrow(()=>f.api.applyMovieIdle(f.s));
    assert.equal(f.calls.filter(c=>c[0]==='reset').length,1,'Restore original cinematic binding on pose failure');
    f.api.applyMovieIdle(f.s);
    assert.equal(f.calls.filter(c=>c[0]==='reset').length,1,'Do not retry a cosmetic error every tick');
    assert.equal(f.calls.filter(c=>c[0]==='stop').length,0,'Keep entrance/exit movie running');
}
console.log('PASS: cinematic binding isolation, native idle asset, deferred spawn, one-time start, respawn, cleanup and missing-asset handling.');
