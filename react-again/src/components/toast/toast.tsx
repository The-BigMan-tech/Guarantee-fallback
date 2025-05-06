import { ToastContainer, toast,Bounce,ToastOptions} from 'react-toastify';
import { selectError,selectNotice,selectLoadingMessage,Message} from '../../redux/processingSlice';
import { selector } from '../../redux/hooks';
import { useEffect, useState} from 'react';

export default function Toasts() {
    const error:Message = selector(store=>selectError(store));
    const notice:Message = selector(store=>selectNotice(store));
    const loadingMessage:string | null = selector(store=>selectLoadingMessage(store));
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
            const errorToast =()=> toast.error(error.message,toastConfig)
            errorToast()
        }
    },[error,toastConfig])
    useEffect(()=>{
        if (notice.message) {
            const noticeToast =()=> toast.info(notice.message,toastConfig)
            noticeToast()
        }
    },[notice,toastConfig])
    useEffect(()=>{
        const loading_toast_config:ToastOptions = {
            ...toastConfig,
            pauseOnHover:false,
            autoClose:false,
            toastId:"loading"
        }
        console.log("Loading message value: ",loadingMessage)
        const loadingToast =()=>{
            if (loadingMessage !== "Done") {
                toast.loading(loadingMessage,loading_toast_config)
            }else {
                toast.done("loading")
                toast.success(loadingMessage,{...toastConfig,autoClose:3000})
            }
        }
        loadingToast()
    },[loadingMessage,toastConfig])
    return <ToastContainer newestOnTop={true}/>
}