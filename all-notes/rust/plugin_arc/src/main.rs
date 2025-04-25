use mlua::{Lua,Function as LuaFunction,Result as LuaResult,Error as LuaError,Table as LuaTable};
use mlua::{FromLuaMulti,IntoLuaMulti};

fn lua_square(lua:&Lua,num:i32)->LuaResult<i32> {
    let func:LuaFunction = lua.globals().get("square")?;
    func.call(num)
}
fn lua_main(lua:&Lua)->LuaResult<()> {
    let func:LuaFunction = lua.globals().get("main")?;
    func.call(())
}
fn reg_for_lua<Args:FromLuaMulti,LuaReturn:IntoLuaMulti>
    (lua:&Lua,name:&str,func:impl Fn(&Lua,Args)->Result<LuaReturn,LuaError> + 'static)->LuaResult<()> {
        let lua_table:LuaTable = lua.create_table()?;
        let lua_func: LuaFunction = lua.create_function(func)?;
        lua_table.set(name, lua_func)?;
        lua.globals().set("rust", lua_table)?;
        Ok(())
}
fn main()->LuaResult<()>  {
    let lua: Lua = Lua::new();
    lua.load(include_str!("./jet/output/plugin.lua")).exec()?;

    let result: i32 = lua_square(&lua,3)?;
    println!("Result:{}", result); 

    let sum = |_:&Lua,(a,b):(i32,i32)| {
        Ok(a + b)
    };
    reg_for_lua(&lua,"sum", sum)?;
    lua_main(&lua)?;
    Ok(())
}