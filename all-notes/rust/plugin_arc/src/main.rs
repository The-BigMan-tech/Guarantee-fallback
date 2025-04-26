use mlua::{Lua,Function as LuaFunction,Result as LuaResult,Error as LuaError,Table as LuaTable};
use mlua::{FromLuaMulti,IntoLuaMulti};

mod lua_functions {
    use super::*;
    pub fn lua_square(lua:&Lua,num:i32)->LuaResult<i32> {
        let func:LuaFunction = lua.globals().get("square")?;
        func.call(num)
    }
    pub fn lua_main(lua:&Lua,geo:&mut GEO)->LuaResult<()> {
        let func:LuaFunction = lua.globals().get("main")?;
        let new_model_num: i32 = func.call(())?;
        geo.model = new_model_num;
        Ok(())
    }
}
mod rust_api {
    use super::*;
    pub fn register<Args:FromLuaMulti,LuaReturn:IntoLuaMulti>
        (lua:&Lua,name:&str,func:impl Fn(&Lua,Args)->Result<LuaReturn,LuaError> + 'static)->LuaResult<()> {
            let lua_table:LuaTable = lua.globals().get("rust").unwrap_or_else(|_| lua.create_table().unwrap());
            let lua_func: LuaFunction = lua.create_function(func)?;
            lua_table.set(name, lua_func)?;
            lua.globals().set("rust", lua_table)?;
            Ok(())
    }
    pub fn plug_api(lua:&Lua,geo:&GEO)->LuaResult<()> {
        let model: i32 = geo.model.clone();
        let sum = |_:&Lua,(a,b):(i32,i32)|->LuaResult<i32> {
            Ok(a + b)
        };
        let change_model = move |_:&Lua,num:i32|->LuaResult<i32> {
            Ok(model + num)
        };
        register(&lua,"sum", sum)?;
        register(&lua,"change_model", change_model)?;
        Ok(())
    }
}
#[derive(Clone)]
struct GEO {
    model:i32
}
use self::lua_functions::*;
use self::rust_api::*;
fn main()->LuaResult<()>  {
    let mut geo: GEO = GEO {model:1};
    println!("Geo model before: {:?}",geo.model);

    let lua: Lua = Lua::new();
    lua.load(include_str!("./jet/output/plugin.lua")).exec()?;
    plug_api(&lua,&geo)?;

    let result: i32 = lua_square(&lua,3)?;
    println!("Result:{}", result); 
    lua_main(&lua,&mut geo)?;
    
    println!("Geo model after: {:?}",geo.model);
    Ok(())
}