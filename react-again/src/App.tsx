import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { selectValueFrom,increment} from './redux/processingSlice'
import { selector,useAppDispatch} from './redux/hooks'

function App() {
  const dispatch = useAppDispatch();
  const [count, setCount] = useState(0);
  const value:number = selector((store)=>selectValueFrom(store));

  function increaseValue():void {
      dispatch(increment(1))
  }
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button  onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs text-red-500">
        Click on the Vite and React logos to learn more
      </p>
      <button className="btn">Default</button>
      <h1 onClick={increaseValue}>Redux value" {value}</h1>
    </>
  )
}
export default App
