import { ToastContainer, toast,Bounce,ToastOptions} from 'react-toastify';
import { selectError,selectNotice} from '../../redux/selectors';
import { Message } from '../../redux/types';
import { selector } from '../../redux/hooks';
import { useEffect, useState} from 'react';

export default function Toasts() {
    //my design is that there can be multiple error and notice messages but only one loading message at a time
    //there are multiple errors and notcie because of spamming and only one of loading to prevent ambiguity
    const error:Message = selector(store=>selectError(store));
    const notice:Message = selector(store=>selectNotice(store));
    const [toastConfig] = useState<ToastOptions>({
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        transition: Bounce,
    })
    useEffect(()=>{
        if (error.message) {
            toast.error(error.message,toastConfig);
            toast.dismiss("loading")//since an error occured there is no reason why it should continue to show loading
        }
    },[error,toastConfig])
    useEffect(()=>{
        if (notice.message) {
            toast.info(notice.message,toastConfig)
        }
    },[notice,toastConfig])
    return <ToastContainer newestOnTop={true}/>
}