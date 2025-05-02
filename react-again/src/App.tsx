import { selectValueFrom,increment} from './redux/processingSlice'
import { selector,useAppDispatch} from './redux/hooks'

function App() {
    const dispatch = useAppDispatch();
    const value:number = selector((store)=>selectValueFrom(store));

    function increaseValue():void {
        dispatch(increment(1))
    }
    return (
      <>
        <button className='cursor-pointer' onClick={increaseValue}>Redux value: {value}</button>
      </>
    )
}
export default App
