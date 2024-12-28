import { useState } from 'react'
import {Provider} from 'react-redux'
import store from './store'
import Input from './features/input/input'
import Display from './features/display/display'

function App() {

  return (
    <Provider store={store}>
        <div className='flex flex-col items-center relative top-[15vh] gap-6 h-[80vh]'>
          <Display/>
          <Input/>
        </div>
    </Provider>
  )
}
export default App
