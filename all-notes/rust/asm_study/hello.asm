segment .data
    name DB 'Person',13,10,0
    person_len EQU $ - name

segment .text
    win_api:global main
    extern ExitProcess
    extern WriteConsoleA
    extern GetStdHandle

    main:
        
    syswrite:sub RSP,40
    mov ECX,-11             
    call GetStdHandle

    logic:mov RCX,RAX   
    lea RDX,[rel name]       
    mov R8D,person_len     
    mov R9D,0
    call WriteConsoleA

    exit:xor ECX,ECX        
    call ExitProcess
