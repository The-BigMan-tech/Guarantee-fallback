local function Hello(num:number)
    print("Hello world");
    if (num < 10) then
        print(num,"is less than 10")
    end
end
local x:number = 10;
Hello(x);

local interface Point
    x: integer
    y: integer
end
local z:Point = {x=10,y=10}
print(z.x,z.y)