import shutil
import os
import argparse
import subprocess

parser = argparse.ArgumentParser()
parser.add_argument('--name', type=str,default='build')
args = parser.parse_args()

#清除之前的打包文件
cache=["build","build.zip",f'{args.name}.mcpack','scripts']
for file in cache:
    if os.path.exists(file):
        if os.path.isdir(file):
            shutil.rmtree(file)
        else:
            os.remove(file)
os.makedirs("build")

print("编译")
result=subprocess.Popen(['tsc'],shell=os.name=="nt")
result.wait()

#复制文件到build文件夹
files=["manifest.json","pack_icon.png","scripts"]
for file in files:
    if os.path.isdir(file):
        shutil.copytree(file,"build/"+file)
    else:
        shutil.copy(file,"build")

#打包
shutil.make_archive("build","zip","build")
os.rename("build.zip",f"{args.name}.mcpack")
#清除临时文件
shutil.rmtree("build")
print("打包完成")