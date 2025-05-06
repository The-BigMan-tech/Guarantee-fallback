import { ToastContainer, toast,Bounce,ToastOptions } from 'react-toastify';
import { selectError,selectNotice,selectLoading,Message} from '../../redux/processingSlice';
import { selector } from '../../redux/hooks';
import { useEffect } from 'react';

export default function Toasts() {
    const error:Message = selector(store=>selectError(store));
    const notice:Message = selector(store=>selectNotice(store));
    const loading:string = selector(store=>selectLoading(store));
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
        const errorToast = ()=> toast.error(error.message,error_config)
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
        const noticeToast = ()=> toast.info(notice.message,notice_config)
        noticeToast()
    },[notice])
    useEffect(()=>{
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
        const loadingToast = ()=>toast(loading,loading_config);
        loadingToast();
    },[loading])
    return <ToastContainer/>
}