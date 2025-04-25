if (true == false) then require("types/rust") end


function square(num)
   return num * num
end

function main()
   local sum = rust.sum(10, 12)
   print("Sum on lua side is: ", sum)
end
