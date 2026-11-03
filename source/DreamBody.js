"use strict";
const UE = require("ue");
const cpp = require("cpp");
const { $ref, $unref } = require("puerts");
const Helper = require("./Library/TsHelper").default;
const { text, registerItemText } = require("./DreamBodyText");
const Debug = require("./DreamBodyDebug");
try { registerItemText(); } catch (error) { console.warn("[DreamBody] native item text: "+error); }

const ID = "PBZ_DreamBody";
const MAP = "PBZ_Zhengdaodaying_WP";
const ICON = "/Game/PBZContent/UI/UINew/items/T_DreamBody_01.T_DreamBody_01";
const COLLAPSE = "/Game/PBZContent/Sequencer/LD_LJC/LS_LJC_DianTiSunHuai.LS_LJC_DianTiSunHuai";
const MOVIE_IDLE = "/HuaShira/Characters/Hero/Hero_Hun/Animation/Locomotion/Unarmed/Idle/Hun_Unarmed_Idle_Loop.Hun_Unarmed_Idle_Loop";
const WEATHER = "/AkashaEffects/UltraDynamicSkyExtends/WeatherBlendVolume.WeatherBlendVolume_C";
const LAKE_SKY = "/Weather/OurWeather/Blueprints/Ultra_Dynamic_Sky_Child.Ultra_Dynamic_Sky_Child_C";
// Seq047_Light_Z binds PostProcessVolume_MGH_HP5 and its weather component by these object identities.
const SUNSET = "PostProcessVolume_UAID_E89C25A755057DC302_2143754391";
const OTHER_LAKE_PHASES = new Set([
    "PostProcessVolume_UAID_74563C6A70330C3F02_1962192098",
    "PostProcessVolume_UAID_74563C6A7033739C02_1439282238",
    "PostProcessVolume_UAID_74563C6A7033D1BC02_1983999572",
    "PostProcessVolume_UAID_E89C25A75505679902_1258131861"
]);
const broken = { X: -64682.77, Y: 85172.48, Z: -5721.805 };
const aftermath = { X: -64218.156, Y: 86504.83, Z: -5629.749 };
const bottom = { X: -64486.54, Y: 84352.75, Z: -5739.62 };
const shore = { X: -68238.21, Y: 76889.97, Z: 839 };
const upper = { X: -65187.168, Y: 84218.66, Z: 1174.59 };
const dirLength = Math.hypot(upper.X - shore.X, upper.Y - shore.Y);
const nx = (upper.X - shore.X) / dirLength, ny = (upper.Y - shore.Y) / dirLength;
let active,runSerial=0;
const detailLayouts=new WeakMap();

function valid(obj) { return !!obj && UE.KismetSystemLibrary.IsValid(obj); }
function vector(p) { return new UE.Vector(p.X, p.Y, p.Z); }
function point(p) { return { X: p.X, Y: p.Y, Z: p.Z }; }
function distance2(a, b) { return Math.hypot(a.X-b.X, a.Y-b.Y); }
function nearEntrance(p) {
    return [broken, aftermath, bottom, upper].some(q => distance2(p,q) <= 950 && Math.abs(p.Z-q.Z) <= 480);
}
// Both Mu Xiaokui spawners reference BP_MobDomain ...FF4402_2145940471 in Lujia.
// These are its eight perimeter spline points in world space. The lift below is a different floor.
const duelPerimeter = [
    [-75990,74130],[-66443,70570],[-62378,74478],[-60618,79318],
    [-63162,81554],[-68470,83712],[-74471,85196],[-77481,79946]
];
function onDuelGround(p) {
    if(p.Z<120 || p.Z>1440)return false;
    let inside=false;
    for(let i=0,j=duelPerimeter.length-1;i<duelPerimeter.length;j=i++){
        const [x,y]=duelPerimeter[i], [lastX,lastY]=duelPerimeter[j];
        if((y>p.Y)!==(lastY>p.Y) && p.X<(lastX-x)*(p.Y-y)/(lastY-y)+x)inside=!inside;
    }
    return inside;
}
function exitCoordinates(p) {
    return { forward:(p.X-upper.X)*nx+(p.Y-upper.Y)*ny,
        side:Math.abs(-(p.X-upper.X)*ny+(p.Y-upper.Y)*nx), height:Math.abs(p.Z-upper.Z) };
}
function uiNote(widget, key) {
    Debug.event("ui.note",{key});
    const dialog=UE.AsyncAction_ShowConfirmation.ShowConfirmationOk(widget,undefined,cpp.FText.FromString(text(key)));
    dialog.Activate();
}
function tag(context, name) {
    const pipeline=Helper.getWorldSubsystem(context,UE.EventPipelineManager.StaticClass());
    return valid(pipeline) && pipeline.HasTagWithOutSource(Helper.constructGameplayTag(name));
}
function decorateSlot(button) {
    button["Item ID"]=ID;
    button.HasNumText.SetVisibility(UE.ESlateVisibility.Collapsed);
    const icon=UE.Object.Load(ICON);
    if(valid(icon)){
        button.IconImage.SetBrushFromTexture(icon,false);
        button.IconImage.SetVisibility(UE.ESlateVisibility.SelfHitTestInvisible);
        button.IconImage.SetRenderOpacity(1);
        button.PBZScriptIconBaseTex=icon;
    }
}
function showDetail(widget) {
    Debug.event("inventory.detail.begin");
    const detail=widget.W_UnifiedTextDescription;
    const data=UE.PBZBackPackSubsystem.GetPropData(ID);
    if(data?.ItemName?.Key==="DreamBody_Name")detail.initItem_Normal(ID,data,widget.BackpackSubsystem);
    else {
        detail.beginTextContent("item:"+ID);
        detail.ItemSubHeadText.SetVisibility(UE.ESlateVisibility.Collapsed);
        detail.ProgressEntrySizeBox.SetVisibility(UE.ESlateVisibility.Collapsed);
    }
    detail.ItemNameText.SetPBZFormatText(cpp.FText.FromString(text("name")));
    detail.ItemTypeText.SetPBZFormatText(cpp.FText.FromString(text("kind")));
    detail.DetailText.DynamicEntryBox_Desc.Reset();
    detail.DetailText.createEntryWithText(cpp.FText.FromString(text("description")));
    widget.clearItemLayers();
    const icon=UE.Object.Load(ICON);
    if(valid(icon)){
        widget.ItemIcon.SetBrushFromTexture(icon,false);
        widget.ItemIcon.SetBrush(UE.WidgetBlueprintLibrary.MakeBrushFromTexture(icon,480,480));
        // This layer normally stretches its texture across a full-screen ScaleBox.
        // A brush size alone cannot constrain it: the parent scales it up again.
        const image=widget.ItemIcon,parent=image.GetParent(),slot=image.Slot;
        if(valid(parent)&&typeof parent.SetStretch==="function"){
            detailLayouts.set(widget,{parent,slot,stretch:parent.Stretch,h:slot.HorizontalAlignment,v:slot.VerticalAlignment});
            parent.SetStretch(UE.EStretch.None);
            slot.SetHorizontalAlignment(UE.EHorizontalAlignment.HAlign_Center);
            slot.SetVerticalAlignment(UE.EVerticalAlignment.VAlign_Center);
        }
        widget.ItemIcon.SetVisibility(UE.ESlateVisibility.SelfHitTestInvisible);
    }
    detail.DelayRefreshBoxHeight();
    widget.setUseItemKeyBound(true);
    widget.onRefreshTextDetail();
    Debug.event("inventory.detail.ready",{icon:ICON,layout:Debug.widgetSize(widget.ItemIcon)});
}
function restoreDetailLayout(widget){
    const saved=detailLayouts.get(widget);if(!saved)return;
    detailLayouts.delete(widget);
    if(valid(saved.parent))saved.parent.SetStretch(saved.stretch);
    if(valid(saved.slot)){
        saved.slot.SetHorizontalAlignment(saved.h);
        saved.slot.SetVerticalAlignment(saved.v);
    }
}
function traceFloor(pawn, target) {
    const ignored=UE.NewArray(UE.Actor);ignored.Add(pawn);
    const hit=$ref(), start=vector({...target,Z:target.Z+180}), end=vector({...target,Z:target.Z-335});
    const yes=UE.KismetSystemLibrary.LineTraceSingle(pawn,start,end,UE.ETraceTypeQuery.TraceTypeQuery1,false,
        ignored,UE.EDrawDebugTrace.None,hit,true,new UE.LinearColor(),new UE.LinearColor(),0);
    if(!yes) return null;
    const h=$unref(hit);if(!h.bBlockingHit || h.ImpactNormal.Z<0.55) return null;
    return {...target,Z:h.ImpactPoint.Z+pawn.CapsuleComponent.GetScaledCapsuleHalfHeight()+4};
}
function memoryError(key,diagnostic) {
    const error=new Error(diagnostic);
    error.textKey=key;
    return error;
}
function spawnProp(s,cls,p,authoredTransform) {
    const transform=authoredTransform || new UE.Transform();
    if(!authoredTransform){
        transform.Translation=vector(p);transform.Scale3D=new UE.Vector(1,1,1);
        transform.Rotation=new UE.Quat(0,0,0,1);
    }
    const actor=UE.GameplayStatics.BeginDeferredActorSpawnFromClass(s.pc,cls,transform,UE.ESpawnActorCollisionHandlingMethod.AlwaysSpawn,s.pc);
    if(!valid(actor))throw memoryError("failed","Could not spawn transient actor");
    s.props.push(actor);
    actor.SetActorEnableCollision(false);
    UE.GameplayStatics.FinishSpawningActor(actor,transform);
    return actor;
}
function streamAt(s,position) {
    const anchor=spawnProp(s,UE.CameraActor.StaticClass(),position);
    const source=anchor.AddComponentByClass(UE.WorldPartitionStreamingSourceComponent.StaticClass(),false,new UE.Transform(),false);
    if(!valid(source))throw memoryError("sceneUnavailable","Could not create streaming anchor");
    source.EnableStreamingSource();
    return anchor;
}
function enterWithPlayer(s,target) {
    Debug.event("player.enter.begin",{...Debug.state(s),target});
    if(UE.GameplayStatics.GetPlayerCharacter(s.pc,0)!==s.pawn)throw memoryError("failed","Player changed during rewind");
    s.pawn.CharacterMovement.StopMovementImmediately();
    if(!s.pawn.K2_TeleportTo(vector(target),new UE.Rotator(0,248,0)))
        throw memoryError("sceneUnavailable","Player capsule cannot fit at shore");
    s.relocated=true;
    s.pc.SetControlRotation(new UE.Rotator(-8,248,0));
    s.pc.SetViewTargetWithBlend(s.pawn,0);
    s.last=point(s.pawn.K2_GetActorLocation());
    Debug.event("player.enter.done",Debug.state(s));
    console.log("[DreamBody] real player entered "+JSON.stringify(s.last));
}
function returnPlayer(s) {
    if(!s.relocated)return;
    Debug.event("player.return.begin",{...Debug.state(s),origin:s.origin});
    if(!valid(s.pawn)||!valid(s.pc)||UE.GameplayStatics.GetPlayerCharacter(s.pc,0)!==s.pawn||
       UE.GameplayStatics.GetCurrentLevelName(s.pc,true)!==MAP){s.relocated=false;return;}
    s.pawn.CharacterMovement.StopMovementImmediately();
    // The return anchor keeps this previously occupied position loaded during the visit.
    // Use the original transform, not a checkpoint or a fabricated progression state.
    if(!s.pawn.K2_SetActorLocationAndRotation(vector(s.origin),new UE.Rotator(s.rotation.Pitch,s.rotation.Yaw,s.rotation.Roll),false,$ref(),true))
        throw memoryError("failed","Unable to return player to origin");
    s.pc.SetControlRotation(new UE.Rotator(s.control.Pitch,s.control.Yaw,s.control.Roll));
    s.relocated=false;
    Debug.event("player.return.done",Debug.state(s));
    console.log("[DreamBody] real player returned "+JSON.stringify(point(s.pawn.K2_GetActorLocation())));
}
function release(action) {
    try { action(); } catch(e) { Debug.event("cleanup.error",Debug.errorDetails(e));console.warn("[DreamBody] restore: "+e); }
}
function disposeDream(s){
    if(valid(s.pc)&&valid(s.eye)&&s.pc.GetViewTarget()===s.eye)
        release(()=>s.pc.SetViewTargetWithBlend(valid(s.previousView)?s.previousView:s.pawn,0));
    for(const a of s.props.reverse())if(valid(a))release(()=>a.K2_DestroyActor());
    s.props=[];
}
function lakeWeather(pawn) {
    const actors=$ref();UE.GameplayStatics.GetAllActorsOfClass(pawn,UE.PostProcessVolume.StaticClass(),actors);
    const cls=UE.Class.Load(WEATHER);if(!cls)return [];
    const volumes=$unref(actors), selected=[];
    for(let i=0;i<volumes.Num();i++){
        const actor=volumes.Get(i), name=UE.KismetSystemLibrary.GetObjectName(actor);
        if(name!==SUNSET && !OTHER_LAKE_PHASES.has(name))continue;
        const component=actor.GetComponentByClass(cls);
        if(valid(component))selected.push({actor,component,on:name===SUNSET});
    }
    return selected;
}
function setWeather(s) {
    const selected=lakeWeather(s.pawn);
    if(!selected.some(x=>x.on))return false;
    for(const x of selected){
        // Snapshot before the first write so recovery can handle a partial change.
        s.weather.push({actor:x.actor,component:x.component,actorEnabled:x.actor.bEnabled,componentEnabled:x.component.bEnabled});
        x.actor.bEnabled=x.on;x.component.bEnabled=x.on;
    }
    return true;
}
function sunsetAtDuelGround(pawn) {
    if(tag(pawn,"ljc.梦差密室.电梯损坏"))return false;
    const skyClass=UE.Class.Load(LAKE_SKY);
    const sky=skyClass && UE.GameplayStatics.GetActorOfClass(pawn,skyClass);
    if(valid(sky)){
        // The authored Mu Xiaokui sunset preset uses 1750 on Ultra Dynamic Sky's 0–2400 clock.
        const time=sky["Time of Day"] ?? sky["Time Of Day"];
        if(Number.isFinite(time))return time>=1700 && time<=1850;
    }
    // A streaming world may not have supplied the sky instance yet. Require both the encounter
    // phase and its own lighting volume rather than treating an unknown time as sunset.
    if(!tag(pawn,"ljc.沐小葵.沐小葵出场镜头开始") && !tag(pawn,"ljc.沐小葵.战斗结束"))return false;
    return lakeWeather(pawn).some(v=>v.on && v.actor.bEnabled && v.component.bEnabled);
}
function restoreWeather(s) {
    for(const x of s.weather.slice().reverse()){
        try {if(valid(x.component))x.component.bEnabled=x.componentEnabled;}catch(e){console.warn("[DreamBody] weather component restore: "+e);}
        try {if(valid(x.actor))x.actor.bEnabled=x.actorEnabled;}catch(e){console.warn("[DreamBody] weather volume restore: "+e);}
    }
    s.weather=[];
}
function stopSequence(s) {
    Debug.event("movie.stop",Debug.state(s));
    if(valid(s.player)){
        if(s.finished)release(()=>s.player.OnFinished.Remove(s.finished));
        release(()=>s.player.Stop());
    }
    if(valid(s.sequenceActor))release(()=>s.sequenceActor.K2_DestroyActor());
    releaseMovieInput(s);
    s.player=undefined;s.sequenceActor=undefined;s.movieMesh=undefined;s.movieIdle=undefined;s.movieMeshBinding=undefined;
}
function disableMovieIdle(s,error) {
    Debug.event("movie.idle.error",{...Debug.state(s),...Debug.errorDetails(error)});
    // Cosmetic failures must never interrupt a working entrance or return sequence.
    if(s.movieMeshBinding && valid(s.sequenceActor))release(()=>s.sequenceActor.ResetBinding(s.movieMeshBinding));
    s.movieIdle=undefined;s.movieMesh=undefined;s.movieMeshBinding=undefined;
    console.warn("[DreamBody] cinematic idle unavailable; retaining original sequence: "+error);
}
function prepareMovieIdle(s) {
    try {
    s.movieIdle=UE.Object.Load(MOVIE_IDLE);
    if(!valid(s.movieIdle))throw new Error("Soul standing animation unavailable");
    // Override only this playback instance's CharacterMesh0 binding. Its skeletal-animation
    // track must not switch the mesh back to an uninitialised cinematic animation instance.
    // Keep the parent Player binding, transform, lift, camera and effects tracks intact.
    const meshBinding=s.sequenceActor.FindNamedBinding("Player");
    const guid=new UE.Guid();
    guid.A=0x0112370F;guid.B=0x4A782F10;guid.C=0x05716994;guid.D=0x3F42A7DE;
    meshBinding.Guid=guid;
    s.movieMeshBinding=meshBinding;
    s.sequenceActor.SetBinding(meshBinding,UE.NewArray(UE.Actor),false);
    Debug.event("movie.idle.prepared",{...Debug.state(s),animation:MOVIE_IDLE});
    }catch(error){disableMovieIdle(s,error);}
}
function applyMovieIdle(s) {
    if(!valid(s.movieIdle))return;
    try {
    const objects=s.player.GetBoundObjects(s.sequenceActor.FindNamedBinding("Player"));
    for(let i=0;i<objects.Num();i++){
        const actor=objects.Get(i);
        // The sequence owns this temporary actor. Never alter the playable character's mesh
        // or animation state, even if a future game build resolves the binding differently.
        if(!valid(actor)||actor===s.pawn)continue;
        const mesh=actor.GetComponentByClass(UE.SkeletalMeshComponent.StaticClass());
        if(!valid(mesh)||mesh===s.pawn.Mesh)continue;
        const instance=mesh.GetAnimInstance();
        const mode=mesh.GetAnimationMode();
        const correct=mode===UE.EAnimationMode.AnimationSingleNode&&valid(instance)&&
            instance.CurrentAsset===s.movieIdle&&mesh.IsPlaying()&&!mesh.bPauseAnims;
        if(mesh===s.movieMesh&&correct)return;
        mesh.bPauseAnims=false;
        mesh.VisibilityBasedAnimTickOption=UE.EVisibilityBasedAnimTickOption.AlwaysTickPoseAndRefreshBones;
        mesh.PlayAnimation(s.movieIdle,true);
        s.movieMesh=mesh;
        Debug.event("movie.idle.applied",{...Debug.state(s),actor:Debug.name(actor),mesh:Debug.name(mesh),previousMode:mode,previousAsset:Debug.name(instance?.CurrentAsset)});
        return;
    }
    }catch(error){disableMovieIdle(s,error);}
}
function lockMovieInput(s){
    // CommonUI's scoped token filters keyboard, mouse, touch and gamepad before
    // menu actions can pause a sequence whose player was created outside the story flow.
    if(s.inputToken!==undefined)return;
    s.inputToken=UE.CommonUIExtensions.SuspendInputForPlayer(s.pc,"DreamBodyMovie");
    if(!s.inputToken||String(s.inputToken)==="None")throw memoryError("filmUnavailable","Could not suspend cinematic menu input");
    Debug.event("movie.input.lock",{...Debug.state(s),token:String(s.inputToken)});
}
function releaseMovieInput(s){
    if(s.inputToken===undefined)return;
    const token=s.inputToken;s.inputToken=undefined;
    if(valid(s.pc))release(()=>UE.CommonUIExtensions.ResumeInputForPlayer(s.pc,token));
    Debug.event("movie.input.release",{...Debug.state(s),token:String(token)});
}
function forget(s) {Debug.event("run.end",Debug.state(s));if(s.timer)clearInterval(s.timer);s.timer=undefined;if(active===s)active=undefined;}
function message(s,key) {
    const value=text(key);
    console.log("[DreamBody] "+value);
    if(valid(s.pawn))UE.KismetSystemLibrary.PrintString(s.pawn,value,true,true,new UE.LinearColor(1,0.75,0.39,1),5);
}
function leave(s) {
    if(active!==s || s.phase==="leaving")return;
    s.phase="leaving";
    try{returnPlayer(s);disposeDream(s);}catch(error){s.phase="return";message(s,"failed");return;}
    restoreWeather(s);forget(s);
}
function startExit(s) {
    if(active!==s || s.phase!=="dream")return;
    Debug.event("exit.trigger",Debug.state(s));
    try{startMovie(s,false);}catch(error){fail(s,error);}
}
function endCollapse(s) {
    if(active!==s || s.phase!=="collapse")return;
    Debug.event("movie.collapse.finished",Debug.state(s));
    stopSequence(s);
    leave(s);
}
function fail(s,why) {
    Debug.event("run.error",{...Debug.state(s),...Debug.errorDetails(why)});
    console.warn("[DreamBody] "+why);
    try{stopSequence(s);}catch(e){console.warn("[DreamBody] cleanup: "+e);}
    try{returnPlayer(s);disposeDream(s);}catch(error){s.phase="return";message(s,"failed");return;}
    restoreWeather(s);forget(s);
    message(s,why?.textKey || "failed");
    if(valid(s.widget))release(()=>uiNote(s.widget,why?.textKey || "failed"));
}
function endRewind(s) {
    if(active!==s || s.phase!=="rewind")return;
    Debug.event("movie.rewind.finished",Debug.state(s));
    try{
        stopSequence(s);
        // An authored post-duel player landing on the lake deck, checked against the floor at use time.
        const safe=traceFloor(s.pawn,shore);
        Debug.event("shore.floor",{...Debug.state(s),safe});
        if(!safe)throw memoryError("sceneUnavailable","Shore floor not streamed");
        if(!setWeather(s))throw memoryError("sceneUnavailable","Sunset volume not streamed");
        enterWithPlayer(s,safe);
        s.phase="dream";
        Debug.event("dream.ready",Debug.state(s));
        message(s,"entered");
    }catch(e){fail(s,e);}
}
function startMovie(s,reverse=true){
    Debug.event("movie.create.begin",{...Debug.state(s),reverse});
    lockMovieInput(s);
    s.pawn.CharacterMovement.StopMovementImmediately();
    if(reverse){
        // Keep both ends loaded until the original gameplay pawn has returned.
        streamAt(s,s.origin);
        s.previousView=s.pc.GetViewTarget();
        s.eye=spawnProp(s,UE.CameraActor.StaticClass(),shore);
        const streaming=s.eye.AddComponentByClass(UE.WorldPartitionStreamingSourceComponent.StaticClass(),false,new UE.Transform(),false);
        if(valid(streaming))streaming.EnableStreamingSource();
    }
    const settings=new UE.MovieSceneSequencePlaybackSettings();
    settings.bDisableMovementInput=true;settings.bDisableLookAtInput=true;settings.bHideHud=true;settings.bHidePlayer=true;
    settings.FinishCompletionStateOverride=UE.EMovieSceneCompletionModeOverride.ForceRestoreState;
    const actorRef=$ref();
    s.player=UE.LevelSequencePlayer.CreateLevelSequencePlayer(s.pawn,s.asset,settings,actorRef);
    s.sequenceActor=$unref(actorRef);
    if(!valid(s.player)||!valid(s.sequenceActor))throw memoryError("filmUnavailable","Could not create collapse sequence");
    Debug.event("movie.create.done",Debug.state(s));
    // Its Player binding is the asset's own spawnable BP_Seq_Hun. Never bind the real pawn.
    prepareMovieIdle(s);
    const duration=s.player.GetDuration(),fps=duration.Rate.Numerator/duration.Rate.Denominator;
    const seconds=(duration.Time.FrameNumber.Value+duration.Time.SubFrame)/fps;
    if(!Number.isFinite(seconds)||seconds<13||seconds>16)throw memoryError("filmUnavailable","Unexpected sequence duration");
    const pos=new UE.MovieSceneSequencePlaybackParams();
    pos.PositionType=UE.EMovieScenePositionType.Time;pos.UpdateMethod=UE.EUpdatePositionMethod.Jump;
    pos.Time=reverse?seconds-1/fps:0;
    s.player.SetPlaybackPosition(pos);s.phase=reverse?"rewind":"collapse";
    Debug.event("movie.seek.done",{...Debug.state(s),target:pos.Time,duration:seconds});
    applyMovieIdle(s);
    s.finished=()=>{Debug.event("movie.finished.callback",Debug.state(s));setTimeout(()=>reverse?endRewind(s):endCollapse(s),0);};s.player.OnFinished.Add(s.finished);
    if(reverse)s.player.PlayReverse();else s.player.Play();
    s.startedAt=UE.GameplayStatics.GetTimeSeconds(s.pawn);s.duration=seconds;
    s.wallDeadline=Date.now()+45000;
    Debug.event("movie.play",Debug.state(s));
}
function tick(s){
    if(active!==s)return;
    try{
        if(Date.now()>(s.nextDebugAt||0)){s.nextDebugAt=Date.now()+2000;Debug.event("run.heartbeat",Debug.state(s));}
        if(!valid(s.pawn)||!valid(s.pc)||UE.GameplayStatics.GetPlayerCharacter(s.pc,0)!==s.pawn||
           UE.GameplayStatics.GetCurrentLevelName(s.pc,true)!==MAP){
            try{stopSequence(s);disposeDream(s);}finally{restoreWeather(s);forget(s);}return;
        }
        if(s.phase==="menu"){
            if(Date.now()>s.deadline){fail(s,memoryError("menu","System menu timeout"));return;}
            if(UE.GameplayStatics.IsGamePaused(s.pc))return;
            if(!nearEntrance(s.pawn.K2_GetActorLocation())){fail(s,memoryError("moved","Left the lift exit"));return;}
            startMovie(s);return;
        }
        if(s.phase==="rewind"||s.phase==="collapse"){
            // Spawn tracks may create or replace the cinematic actor after the initial seek.
            applyMovieIdle(s);
            if(Date.now()>s.wallDeadline || UE.GameplayStatics.GetTimeSeconds(s.pawn)-s.startedAt>s.duration+4)
                fail(s,memoryError("filmUnavailable","Sequence playback timeout (wall-clock protected)"));
            return;
        }
        if(s.phase==="return"){leave(s);return;}
        if(s.phase!=="dream"||UE.GameplayStatics.IsGamePaused(s.pc))return;
        const p=point(s.pawn.K2_GetActorLocation()),e=exitCoordinates(p),previous=exitCoordinates(s.last);
        // Cross toward the upper lift from the lakeside. The boundary is on solid ground before the shaft.
        const crosses=previous.forward < -420 && e.forward >= -420 && e.side<740 && e.height<500;
        s.last=p;
        // Also return if a dodge or fall skips past the narrow boundary in one update.
        if(crosses || (e.forward>=-420 && e.side<740 && p.Z<upper.Z+500))startExit(s);
        else if(p.Z < -1000)leave(s);
    }catch(e){fail(s,e);}
}
function use(widget){
    const pc=widget.GetOwningPlayer(),pawn=UE.GameplayStatics.GetPlayerCharacter(widget,0);
    if(!valid(pawn)||!valid(pc))return;
    if(active && active.pawn===pawn && active.pc===pc){
        uiNote(widget,active.phase==="dream" && onDuelGround(pawn.K2_GetActorLocation()) ? "verse" : "already");
        return;
    }
    // An immediately reloaded save can open the bag before the previous world's next tick.
    if(active){const old=active;stopSequence(old);leave(old);}
    const atLake=UE.GameplayStatics.GetCurrentLevelName(pawn,true)===MAP;
    const position=pawn.K2_GetActorLocation();
    const atExit=atLake && nearEntrance(position);
    Debug.event("use.request",{map:UE.GameplayStatics.GetCurrentLevelName(pawn,true),position:point(position),atExit,bossDefeated:tag(pawn,"ljc.沐小葵.战斗结束"),pawn:Debug.name(pawn)});
    if(atLake && !atExit && onDuelGround(position) && sunsetAtDuelGround(pawn)){
        uiNote(widget,"verse");return;
    }
    if(!tag(pawn,"ljc.沐小葵.战斗结束")){
        uiNote(widget,"locked");return;
    }
    if(!atExit){
        uiNote(widget,"exitOnly");return;
    }
    if(Helper.isInCombat(pawn)){uiNote(widget,"combat");return;}
    const asset=UE.Object.Load(COLLAPSE);
    if(!valid(asset)){uiNote(widget,"filmUnavailable");return;}
    const rotation=pawn.K2_GetActorRotation(),control=pc.GetControlRotation();
    const s={run:++runSerial,pc,pawn,asset,widget,phase:"menu",weather:[],props:[],origin:point(position),
        rotation:{Pitch:rotation.Pitch,Yaw:rotation.Yaw,Roll:rotation.Roll},
        control:{Pitch:control.Pitch,Yaw:control.Yaw,Roll:control.Roll},deadline:Date.now()+30000};
    active=s;
    Debug.event("run.begin",{...Debug.state(s),origin:s.origin,rotation:s.rotation,control:s.control});
    try{widget.CloseWidget();s.timer=setInterval(()=>tick(s),32);}catch(e){fail(s,e);}
}
exports.ID=ID;exports.decorateSlot=decorateSlot;exports.showDetail=showDetail;exports.restoreDetailLayout=restoreDetailLayout;exports.use=use;
