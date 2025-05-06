import { ToastContainer, toast,Bounce,ToastOptions } from 'react-toastify';
import { selectError,selectNotice } from '../../redux/processingSlice';
import { selector } from '../../redux/hooks';
import { useEffect } from 'react';

export default function Toasts() {
    const error:string | null = selector(store=>selectError(store));
    const notice:string | null = selector(store=>selectNotice(store));
    useEffect(()=>{
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
        const errorToast = ()=> toast.error(error,error_config)
        errorToast()
    },[error])
    useEffect(()=>{
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
        const noticeToast = ()=> toast.error(notice,notice_config)
        noticeToast()
    },[notice])
    return <ToastContainer/>
}