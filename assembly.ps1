param([string]$asm_file_name,[string]$folderPath)
$workDir = $folderPath -replace '\\','/'

#*Path to the msys2 shell
$msys2Shell = "C:/msys64/msys2_shell.cmd"

#*Build commands
$cdCmd = "cd $workDir"
$asmCmd   = "nasm -f elf64 $asm_file_name.asm -o $asm_file_name.o"
$linkCmd  = "gcc $asm_file_name.o -o $asm_file_name"
$runCmd   = "./$asm_file_name.exe"
$cleanCmd = "rm $asm_file_name.exe $asm_file_name.o"

#*Full command
$msysCmd = "$cdCmd && $asmCmd && $linkCmd && $runCmd && $cleanCmd"

#*Run the command in MSYS2 MinGW64 environment
& $msys2Shell -mingw64 -defterm -no-start -here -c $msysCmd
