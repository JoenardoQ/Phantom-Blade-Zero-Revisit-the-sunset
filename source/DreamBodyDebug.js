"use strict";
// Diagnostic build: only writes these two mod-owned text files under Saved/Logs.
// Never uses the game's save subsystem or a caller-supplied file path.
const UE=require("ue");
const { $ref, $unref }=require("puerts");
const VERSION="2026-11-04-debug2";
const MAX_CHARS=131072;
let initialized=false,disabled=false,filename="",lines=[],chars=0,sequence=0;
const session=new Date().toISOString();
function write(value,path){return UE.EasyCsv.SaveStringToFileWithFullPath(value,path);}
function init(){
    if(initialized)return;
    initialized=true;
    const directory=String(UE.BlueprintPathsLibrary.ProjectSavedDir()).replace(/\\/g,"/").replace(/\/$/,"")+"/Logs/";
    filename=directory+"DreamBody-debug.log";
    const previous=$ref("");
    if(UE.EasyCsv.LoadStringFromLocalFile(filename,previous)){
        const value=String($unref(previous));
        if(value)write(value.slice(-MAX_CHARS),directory+"DreamBody-debug.previous.log");
    }
}
function errorDetails(error){
    return {message:String(error),textKey:error?.textKey,stack:String(error?.stack||"").slice(0,12000)};
}
function event(name,data={}){
    if(disabled)return;
    try{
        init();
        const entry=JSON.stringify({at:new Date().toISOString(),session,seq:++sequence,version:VERSION,event:name,...data})+"\n";
        lines.push(entry);chars+=entry.length;
        while(chars>MAX_CHARS&&lines.length>1)chars-=lines.shift().length;
        if(!write(lines.join(""),filename))throw new Error("Text writer returned false");
    }catch(error){
        disabled=true;
        console.warn("[DreamBody] Debug log disabled after write failure: "+error);
    }
}
function name(object){
    try{return object&&UE.KismetSystemLibrary.IsValid(object)?UE.KismetSystemLibrary.GetObjectName(object):"invalid";}catch{return "unavailable";}
}
function position(actor){
    try{const p=actor.K2_GetActorLocation();return {X:p.X,Y:p.Y,Z:p.Z};}catch{return null;}
}
function widgetSize(widget){
    try{
        const size=widget.GetDesiredSize(),scale=widget.RenderTransform.Scale,brush=widget.Brush.ImageSize;
        return {desired:{X:size.X,Y:size.Y},scale:{X:scale.X,Y:scale.Y},brush:{X:brush.X,Y:brush.Y},slot:name(widget.Slot)};
    }catch(error){return {error:String(error)};}
}
function state(s){
    const result={run:s?.run,phase:s?.phase,pawn:name(s?.pawn),position:position(s?.pawn),relocated:!!s?.relocated};
    try{
        result.paused=UE.GameplayStatics.IsGamePaused(s.pc);
        result.gameSeconds=UE.GameplayStatics.GetTimeSeconds(s.pc);
        result.view=name(s.pc.GetViewTarget());
        if(s.player&&UE.KismetSystemLibrary.IsValid(s.player)){
            result.playing=s.player.IsPlaying();
            const time=s.player.GetCurrentTime();
            result.movieSeconds=(time.Time.FrameNumber.Value+time.Time.SubFrame)*time.Rate.Denominator/time.Rate.Numerator;
            if(s.movieMesh&&UE.KismetSystemLibrary.IsValid(s.movieMesh)){
                result.animationMode=s.movieMesh.GetAnimationMode();
                result.animationAsset=name(s.movieMesh.GetAnimInstance()?.CurrentAsset);
                result.animationPlaying=s.movieMesh.IsPlaying();
            }
        }
    }catch(error){result.stateError=String(error);}
    return result;
}
exports.event=event;exports.errorDetails=errorDetails;exports.state=state;exports.position=position;exports.name=name;exports.widgetSize=widgetSize;
event("module.loaded");
