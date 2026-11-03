const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/DreamBodyDebug.js','utf8');
function setup(broken=false){
    const files=new Map([['C:/Test/Saved/Logs/DreamBody-debug.log','previous session\n']]);
    let writes=0;
    const UE={BlueprintPathsLibrary:{ProjectSavedDir:()=> 'C:\\Test\\Saved\\'},EasyCsv:{
        LoadStringFromLocalFile:(p,out)=>{out.value=files.get(p);return files.has(p);},
        SaveStringToFileWithFullPath:(text,p)=>{writes++;if(broken)throw Error('read-only log folder');files.set(p,text);return true;}
    }};
    const context={exports:{},require:n=>n==='ue'?UE:{$ref:value=>({value}),$unref:r=>r.value},console:{warn(){}}};
    vm.runInNewContext(source,context);
    return {api:context.exports,files,writes:()=>writes};
}
{
    const f=setup();
    assert.equal(f.files.get('C:/Test/Saved/Logs/DreamBody-debug.previous.log'),'previous session\n');
    f.api.event('run.error',{run:3,...f.api.errorDetails(Error('测试异常'))});
    let entries=f.files.get('C:/Test/Saved/Logs/DreamBody-debug.log').trim().split('\n').map(JSON.parse);
    assert.equal(entries.at(-1).event,'run.error');assert.match(entries.at(-1).stack,/测试异常/);
    for(let i=0;i<1100;i++)f.api.event('heartbeat',{iteration:i,payload:'x'.repeat(180)});
    const value=f.files.get('C:/Test/Saved/Logs/DreamBody-debug.log');assert.ok(value.length<=131072);
    entries=value.trim().split('\n').map(JSON.parse);assert.equal(entries.at(-1).iteration,1099);
    assert.ok([...f.files.keys()].every(p=>/^C:\/Test\/Saved\/Logs\/DreamBody-debug(?:\.previous)?\.log$/.test(p)));
}
{
    const f=setup(true),before=f.writes();
    assert.doesNotThrow(()=>{f.api.event('run.begin');f.api.event('player.return.done');});
    assert.equal(f.writes(),before,'A failed writer must not keep retrying or interrupt gameplay');
}
console.log('PASS: readable structured logs, stack traces, previous-session preservation, bounded size, fixed log-only paths, non-fatal write failures.');
