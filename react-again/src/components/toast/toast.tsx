import { ToastContainer, toast,Bounce,ToastOptions } from 'react-toastify';
import { selectError,selectNotice,selectLoadingMessage,Message} from '../../redux/processingSlice';
import { selector } from '../../redux/hooks';
import { useEffect } from 'react';

export default function Toasts() {
    const error:Message = selector(store=>selectError(store));
    const notice:Message = selector(store=>selectNotice(store));
    const loadingMessage:Message = selector(store=>selectLoadingMessage(store));
    useEffect(()=>{
        if (error.message) {
            const error_config:ToastOptions = {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Bounce,
            }
            const errorToast = ()=> toast.error(error.message,error_config)
            errorToast()
        }
    },[error])
    useEffect(()=>{
        if (notice.message) {
            const notice_config:ToastOptions = {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Bounce,
            }
            const noticeToast = ()=> toast.info(notice.message,notice_config)
            noticeToast()
        }
    },[notice])
    useEffect(()=>{
        if (loadingMessage.message) {
            const loading_config:ToastOptions = {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: false,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "dark",
                transition: Bounce,
            }
            const loadingToast = ()=>toast(loadingMessage.message,loading_config)
            loadingToast()
        }
    },[loadingMessage])
    return <ToastContainer newestOnTop={true}/>
}