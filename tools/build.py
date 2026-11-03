"""Rebuild the JavaScript PAK using a matching local game script and released assets.

This script does not install anything or access save files. See docs/BUILD.md.
"""
import argparse
import hashlib
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parents[1]
STOCK_SHA256 = '4cbb19fd23e0ec1c870265124df31438779ff5092d7166cedfd0531579502f0c'
MODULES = ('DreamBody.js', 'DreamBodyDebug.js', 'DreamBodyText.js')

def run(args, cwd=None):
    subprocess.run([str(arg) for arg in args], cwd=cwd, check=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--inventory', type=Path, required=True,
                        help='Unmodified NewInventory.js extracted from your own matching game build')
    parser.add_argument('--base-archive', type=Path,
                        help='Released Dreambody ZIP containing the cooked 4K IoStore assets')
    parser.add_argument('--unrealpak', type=Path, help='Path to UnrealPak.exe')
    parser.add_argument('--output', type=Path, default=ROOT/'dist/Dreambody-custom.zip')
    parser.add_argument('--check-only', action='store_true', help='Validate sources and patch without packaging')
    args = parser.parse_args()
    stock = args.inventory.read_bytes()
    if hashlib.sha256(stock).hexdigest() != STOCK_SHA256:
        parser.error('NewInventory.js does not match the tested Steam build 26266538.')
    if not args.check_only and (not args.base_archive or not args.unrealpak):
        parser.error('--base-archive and --unrealpak are required for packaging')
    for test in sorted((ROOT/'source').glob('*.test.cjs')):
        run(['node', test])
    for name in MODULES:
        run(['node', '--check', ROOT/'source'/name])
    (ROOT/'build').mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='dreambody-', dir=ROOT/'build') as temporary:
        work = Path(temporary)
        js = work/'ProjectPBZ/Content/JavaScript'
        target = js/'UI/Widget/NewInventory.js'
        target.parent.mkdir(parents=True)
        target.write_text(stock.decode('utf-8').replace('\r\n','\n').rstrip('\n')+'\n', encoding='utf-8', newline='\n')
        patch = ROOT/'patches/NewInventory.patch'
        run(['git','apply','--check',patch], cwd=js)
        run(['git','apply',patch], cwd=js)
        run(['node','--check',target])
        for name in MODULES:
            shutil.copyfile(ROOT/'source'/name, js/name)
        if args.check_only:
            print('Source syntax, behavioral checks and stock-inventory patch passed.')
            return
        package = work/'package/~mods'
        package.mkdir(parents=True)
        with zipfile.ZipFile(args.base_archive) as archive:
            for suffix in ('utoc','ucas'):
                name = 'DreamBody_P.'+suffix
                (package/name).write_bytes(archive.read('~mods/'+name))
        inputs = work/'pak-input.txt'
        lines = []
        for item in sorted(js.rglob('*.js')):
            virtual = '../../../ProjectPBZ/Content/JavaScript/'+item.relative_to(js).as_posix()
            lines.append(f'"{item}" "{virtual}"')
        inputs.write_text('\n'.join(lines)+'\n', encoding='utf-8')
        pak = package/'DreamBody_P.pak'
        run([args.unrealpak.resolve(),pak,f'-Create={inputs}','-compress',
             f'-abslog={work / "pak-build.log"}','-unattended','-nopak'])
        run([args.unrealpak.resolve(),pak,'-Test',f'-abslog={work / "pak-test.log"}','-unattended','-nopak'])
        output = args.output.resolve()
        if output.exists():
            parser.error('Output already exists; choose a new --output path.')
        output.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(output,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:
            for item in sorted(package.iterdir()):
                archive.write(item,'~mods/'+item.name)
            archive.write(ROOT/'INSTALL.txt','使用说明.txt')
        print('Created:',output)
        print('SHA256:',hashlib.sha256(output.read_bytes()).hexdigest())

if __name__ == '__main__':
    main()
