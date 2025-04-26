if (true==false) then require "types/rust" end
-- *Rust calls this lua function
global function square(num:number):number
    return num * num
end

global function main():number 
    local sum = rust.sum(10,12)
    print("Sum on lua side is: ",sum)
    local num = rust.change_model(10);
    return num
end