pub fn turn_to_number(num:String)->Result<i32,String> {
    let num_data:i32 = match num.parse() {
        Result::Ok(num)=>num,
        Result::Err(_error) =>{
            return Result::Err(String::from("Please provide a valid number"))
        }
    };
    return Ok(num_data)
}
pub fn question_mark()->Result<i32,String> {
    let input_data:String = String::from("8");
    let data = turn_to_number(input_data)?;
    return Ok(data)
}