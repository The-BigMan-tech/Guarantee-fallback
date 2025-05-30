import { ToastOptions,Bounce,Zoom ,Flip} from "react-toastify"

export const toastConfig:ToastOptions = {
    position: "bottom-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: false,
    pauseOnHover:true,
    draggable: true,
    progress: undefined,
    theme: "dark",
    transition: Bounce,
}
export const loading_toastConfig:ToastOptions = {
    ...toastConfig,
    pauseOnHover:false,
    autoClose:false,
    transition:Zoom,
    toastId:"loading"
}
export const success_toastConfig:ToastOptions = {
    ...toastConfig,
    pauseOnHover:false,
    autoClose:500,
    transition:Flip,
}
