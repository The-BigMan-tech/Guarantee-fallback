import { ToastContainer, toast,Bounce,ToastOptions,Flip, Zoom} from 'react-toastify';
import { selectError,selectNotice,selectLoadingMessage,Message} from '../../redux/processingSlice';
import { selector } from '../../redux/hooks';
import { useEffect, useState} from 'react';

export default function Toasts() {
    const error:Message = selector(store=>selectError(store));
    const notice:Message = selector(store=>selectNotice(store));
    const loadingMessage:string = selector(store=>selectLoadingMessage(store)) || "";
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
    const [loading_toastConfig] = useState<ToastOptions>({
        ...toastConfig,
        pauseOnHover:false,
        autoClose:false,
        transition:Zoom,
        toastId:"loading"
    })
    useEffect(()=>{
        if (error.message) {
            toast.error(error.message,toastConfig)
        }
    },[error,toastConfig])
    useEffect(()=>{
        if (notice.message) {
            toast.info(notice.message,toastConfig)
        }
    },[notice,toastConfig])
    useEffect(()=>{
        if (loadingMessage) {
            toast.dismiss();//to ensure that only one component shows a loading progress at a time.
            if (loadingMessage == "") {//to remove the loading when there is an error cuz it cant be DONE if its an error
                toast.done("loading")
            }else if (!(loadingMessage.trim().startsWith("Done"))) {
                toast.loading(loadingMessage,loading_toastConfig)
            }else {
                toast.done("loading")
                toast.success(loadingMessage,{...toastConfig,autoClose:1000,transition:Flip})
            }
        }
    },[loadingMessage,toastConfig,loading_toastConfig])
    return <ToastContainer newestOnTop={true}/>
}