import {useHookstate as state} from '@hookstate/core'
import {Player} from '@lottiefiles/react-lottie-player'
import animation from './lottie/Animation - 1735134429411.json'

export default function App() {
  const count = state(0)

  function increment() {
    count.set(count=>count + 1)
  }
  return (
    <>
      <div className='flex flex-col items-center justify-center relative left-[36vw]'>
          <Player
              autoplay
              loop
              src={animation}
              style={{ height: '300px', width: '300px' }}
          >
          </Player>
          <div className='text-[#04a5d0]'>{count.get()}</div>
          <button onClick={increment}>Increment</button>
      </div>
    </>
  )
}
