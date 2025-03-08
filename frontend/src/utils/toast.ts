import toast, { ToastOptions } from 'react-hot-toast';

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'bottom-right',
  id: undefined,
  style: {
    borderRadius: '8px',
    background: '#333',
    color: '#fff',
  },
};

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.dismiss();
    toast.success(message, {
      ...defaultOptions,
      ...options,
      style: {
        ...defaultOptions.style,
        background: 'green',
      },
    });
  },
  error: (message: string, options?: ToastOptions) => {
    toast.dismiss();
    toast.error(message, {
      ...defaultOptions,
      ...options,
      style: {
        ...defaultOptions.style,
        background: 'red',
      },
    });
  },
  loading: (message: string, options?: ToastOptions) => {
    toast.dismiss();
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
    });
  },
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    },
    options?: ToastOptions
  ) => {
    toast.dismiss();
    return toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error: messages.error,
      },
      {
        ...defaultOptions,
        success: {
          style: {
            ...defaultOptions.style,
            background: 'green',
          },
          duration: 3000,
        },
        error: {
          style: {
            ...defaultOptions.style,
            background: 'red',
          },
          duration: 4000,
        },
        ...options,
      }
    );
  },
};
export { toast };

