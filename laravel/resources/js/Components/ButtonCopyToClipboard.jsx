import React from "react";
import { ToastContainer, toast, Flip } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ButtonCopyToClipboard({ textToCopy }) {
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copy Successful");
    } catch (err) {
      toast.error("Copy Failed");
    }
  };

  return (
    <>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={true}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        transition={Flip}
      />
      <button
        type="button"
        className="h-6 absolute sm:static top-[308px] sm:h-8 w-12 mx-2 my-2 items-center gap-2 rounded-md border border-transparent font-semibold bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800"
        onClick={() => copyToClipboard(textToCopy)}
      >
        Copy
      </button>
    </>
  );
}
