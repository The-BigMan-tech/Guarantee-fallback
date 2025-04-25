param([string]$full_file_path)
$file_path_object = Get-Item $full_file_path

$asm_file_name = $file_path_object.BaseName -replace '\\','/'
$workDir = $file_path_object.DirectoryName -replace '\\','/'

#*Path to the msys2 shell
$msys2Shell = "C:/msys64/msys2_shell.cmd"

#*Build commands
$cdCmd = "cd $workDir"
$asmCmd   = "nasm -f elf64 -g $asm_file_name.asm -o $asm_file_name.o"
$linkCmd  = "gcc $asm_file_name.o -o $asm_file_name -no-pie"
$runCmd   = "./$asm_file_name.exe"
$cleanCmd = "rm $asm_file_name.o"

#*Full command
$msysCmd = "$cdCmd && $asmCmd && $linkCmd && $runCmd && $cleanCmd"

#*Run the command in MSYS2 MinGW64 environment
& $msys2Shell -mingw64 -defterm -no-start -here -c $msysCmd
