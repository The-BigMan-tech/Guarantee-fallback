import { ToastContainer, toast,Bounce,ToastOptions,Flip, Zoom} from 'react-toastify';
import { selectError,selectNotice,selectLoadingMessage,Message} from '../../redux/processingSlice';
import { selector } from '../../redux/hooks';
import { useEffect, useState} from 'react';

export default function Toasts() {
    //my design is that there can be multiple error and notice messages but only one loading message at a time
    //there are multiple errors and notcie because of spamming and only one of loading to prevent ambiguity
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
            toast.error(error.message,toastConfig);
            toast.dismiss("loading")//since an error occured there is no reason why it should continue to show loading
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
            if (!(loadingMessage.trim().toLowerCase().startsWith("done"))) {
                toast.loading(loadingMessage,loading_toastConfig)
            }else {
                toast.done("loading")
                toast.success(loadingMessage,{...toastConfig,autoClose:1000,transition:Flip})
            }
        }
    },[loadingMessage,toastConfig,loading_toastConfig])
    return <ToastContainer newestOnTop={true}/>
}