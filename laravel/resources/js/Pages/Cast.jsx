import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForm, Controller } from "react-hook-form";
import {
  faCheck,
  faMessage,
  faTimes,
  faTrashCan,
  faEdit,
  faPlus,
  faAngleLeft,
  faAngleRight,
} from "@fortawesome/free-solid-svg-icons";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import ImageCard from "@/Components/ImageCard";
import ImageUploader from "@/Components/ImageUploader";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";
import Modal from "@/Components/Modal";

export default function Cast({ auth }) {
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSidebarButtonHovered, setIsSidebarButtonHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteThread, setDeleteThread] = useState(false);
  const [editInput, setEditInput] = useState(false);
  const [updateTitles, setUpdateTitles] = useState("");
  const [addThreads, setAddThreads] = useState("");
  const [addUploadImages, setAddUploadImages] = useState("");
  const fileInputRef = useRef(null);
  const title =
    threads.find((thread) => thread.id === currentThreadId)?.title || "";
  const uploadedImages =
    threads.find((thread) => thread.id === currentThreadId)?.uploadedImages ||
    "";

  const scrollableContainer = {
    maxHeight: "calc(100vh - 8rem)",
    overflowY: "auto",
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm();

  const startNewThread = () => {
    if (!addThreads) {
      const newThread = {
        id: Date.now(),
        errors: [],
        messages: [],
        threadTitle: "",
      };
      setThreads((prevThreads) => [...prevThreads, newThread]);
      setCurrentThreadId(newThread.id);
      setAddThreads(true);
      reset();
    }
    return;
  };

  const selectThread = (threadId) => {
    reset();
    setCurrentThreadId(threadId);
    renderCurrentUserThread(threadId);
  };

  const handleInputTitle = (event) => {
    const { name, value } = event.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              [name]: value,
            }
          : thread
      )
    );
  };

  const handleSaveTitleUpdate = () => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              threadTitle: updateTitles,
            }
          : thread
      )
    );
    setEditInput(false);
  };

  const validatedFileType = (message) => (value) => {
    const acceptedExtensions = ["mp4", "webm", "mov"];
    const uploadFile = acceptedExtensions.includes(value);
    if (uploadFile) {
      return message;
    }
    return;
  };

  const isNotBlank = (message) => (value) => {
    if (!value.trim()) {
      return message;
    }
    return undefined;
  };
  const persistErrorThreads = () => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, errors } : thread
      )
    );
  };

  const renderCurrentUserThread = (threadId) => {
    const latestUserMessage = threads
      .find((thread) => thread.id === threadId)
      ?.messages.filter((message) => message.role === "user")
      .slice(-1)[0];

    setValue("title", latestUserMessage?.content?.title, {
      shouldValidate: false,
    });
  };

  const handleImageChange = (event) => {
    const { name, files } = event.target;

    if (files && files.length > 0 && files[0].type.startsWith("image/")) {
      const uniqueKey = Date.now();
      const newImages = Array.from(files).map((file, index) => ({
        url: URL.createObjectURL(file),
        key: `${uniqueKey}-${index}`,
      }));
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                [name]: [...(thread[name] || []), ...newImages],
              }
            : thread
        )
      );
    }
    return null;
  };

  const removeUploadedImages = (imageKey) => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) => {
        if (thread.id === currentThreadId) {
          const updatedImages = (thread.uploadedImages || []).filter(
            (image) => image.key !== imageKey
          );
          return {
            ...thread,
            uploadedImages: updatedImages,
          };
        }
        return thread;
      })
    );
  };

  const toggleUploadImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeleteThread = (threadId) => {
    const threadIndex = threads.findIndex((thread) => thread.id === threadId);
    if (threadIndex !== -1) {
      setThreads((prevThreads) => {
        const updatedThreads = prevThreads.filter(
          (thread) => thread.id !== threadId
        );
        if (currentThreadId === threadId) {
          const nextThreadIndex = threadIndex === 0 ? 1 : threadIndex - 1;
          setCurrentThreadId(updatedThreads[nextThreadIndex]?.id || null);
        }
        return updatedThreads;
      });
      setDeleteThread(false);
    }
  };

  const handleKeyDown = (e) => {
    persistErrorThreads();
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  const onSubmit = async (data) => {
    if (uploadedImages.length === 1) {
      setAddUploadImages("*Adding images is requested.");
      return;
    }

    setIsLoading(true);
    setAddUploadImages("");

    const prepareData = { title: data.title, images: uploadedImages };
    const updatedThreads = threads.map((thread) => {
      if (thread.id === currentThreadId) {
        setAddThreads(false);
        thread.messages.push({ role: "user", content: prepareData });
      } else {
        setAddThreads(true);
      }
      return thread;
    });

    setThreads(updatedThreads);

    const currentThread = updatedThreads.find(
      (thread) => thread.id === currentThreadId
    );
    generateImages(currentThread.messages);

    setIsLoading(false);
  };

  const generateImages = (threadMessages) => {
    const prepareImage =
      threadMessages[threadMessages.length - 1]?.content.images;

    setThreads((threads) =>
      threads.map((thread) => {
        if (thread.id === currentThreadId) {
          thread.messages.push({ role: "assistant", content: prepareImage });
        }
        return thread;
      })
    );
  };

  useEffect(() => {
    setUpdateTitles(
      threads.find((thread) => thread.id === currentThreadId)?.threadTitle || ""
    );
    setEditInput(false);
    setValue("uploadedImages", uploadedImages);
    setValue("title", title);
  }, [uploadedImages, title, currentThreadId, fileInputRef]);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Cast
        </h2>
      }
    >
      <Head title="Cast" />

      <div className="flex ...">
        {showSidebar && (
          <div className="shrink-0 w-full md:w-60 lg:w-72 min-h-screen pl-4 py-4 border-r">
            <div className="flex items-start">
              <button
                onClick={startNewThread}
                className="mb-4 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button
                className="lg:hidden md:hidden ml-60 px-4 rounded bg-gray-500 hover:bg-gray-700 text-white"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <FontAwesomeIcon icon={faAngleLeft} />
              </button>
            </div>
            <div className="threadlist-container overflow-y-hidden hover:overflow-y-auto max-h-[calc(100vh-6rem)]">
              {threads
                .slice(0)
                .reverse()
                .map((thread) => {
                  const abbreviatedContent =
                    thread.messages[0]?.content.title.length > 30
                      ? `${thread.messages[0]?.content.title.slice(0, 30)}...`
                      : thread.messages[0]?.content.title;
                  return (
                    <div
                      key={thread.id}
                      onClick={() => selectThread(thread.id)}
                      className={`p-4 cursor-pointer border-b border-gray-200 relative rounded ${
                        currentThreadId === thread.id
                          ? "bg-gray-200 bg-gray-100 rounded-l-sm"
                          : "hover:bg-[#edeff4]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p
                          onClick={() => selectThread(thread.id)}
                          className={`font-bold cursor-pointer ${
                            currentThreadId === thread.id && thread.title
                              ? "whitespace-nowrap"
                              : "truncate"
                          }`}
                        >
                          Thread {thread.id}
                        </p>
                        {abbreviatedContent &&
                          currentThreadId === thread.id && (
                            <>
                              <div className="absolute right right-[40px] w-12 bg-gradient-to-r from-transparent to-gray-200" />
                              <div className="absolute right-0 flex items-center gap-2 px-2 mr-6">
                                {editInput ? (
                                  <>
                                    <button
                                      className="text-gray-500 hover:text-gray-700"
                                      onClick={() =>
                                        handleSaveTitleUpdate(
                                          thread.id,
                                          updateTitles
                                        )
                                      }
                                    >
                                      <FontAwesomeIcon
                                        className="md"
                                        icon={faCheck}
                                      />
                                    </button>
                                    <button
                                      className="text-gray-500 hover:text-gray-700"
                                      onClick={() => {
                                        setEditInput(false);
                                        setUpdateTitles(
                                          thread.threadTitle ||
                                            abbreviatedContent
                                        );
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        className="md"
                                        icon={faTimes}
                                      />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="text-gray-500 hover:text-gray-700"
                                      onClick={() => {
                                        setEditInput(true);
                                        setUpdateTitles(
                                          thread.threadTitle ||
                                            abbreviatedContent
                                        );
                                      }}
                                    >
                                      <FontAwesomeIcon
                                        className="md"
                                        icon={faEdit}
                                      />
                                    </button>
                                    <button
                                      className="text-gray-500 hover:text-gray-700"
                                      onClick={() => setDeleteThread(true)}
                                    >
                                      <FontAwesomeIcon
                                        className="md"
                                        icon={faTrashCan}
                                      />
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                      </div>
                      {editInput && currentThreadId === thread.id ? (
                        <input
                          type="text"
                          value={updateTitles}
                          onChange={(e) => setUpdateTitles(e.target.value)}
                          className="w-full h-6 p-1 mt-1 rounded-sm text-gray-500 border border-gray-300 focus:outline-none focus:ring-blue-300"
                        />
                      ) : (
                        <div className="text-gray-500 truncate">
                          <FontAwesomeIcon className="md" icon={faMessage} />{" "}
                          {thread.threadTitle || abbreviatedContent}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}
        <Modal show={deleteThread} maxWidth="sm">
          <div className="text-gray-700 p-4 space-y-4">
            <h1 className="mt-2 text-lg font-bold">Delete thread?</h1>
            <hr />
            <p>
              this will delete{" "}
              <strong>
                {threads.find((thread) => thread.id === currentThreadId)?.title}
                .
              </strong>
            </p>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setDeleteThread(false)}>
                Cancel
              </SecondaryButton>
              <DangerButton onClick={() => handleDeleteThread(currentThreadId)}>
                Delete
              </DangerButton>
            </div>
          </div>
        </Modal>

        <div className="flex-1 min-h-screen ...">
          <div style={scrollableContainer} className="p-4">
            <div className="relative group w-fit mb-4">
              <button
                onClick={() => {
                  setShowSidebar(!showSidebar),
                    setIsSidebarButtonHovered(false);
                }}
                onMouseEnter={() => setIsSidebarButtonHovered(true)}
                onMouseLeave={() => setIsSidebarButtonHovered(false)}
                className="y-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
              >
                <FontAwesomeIcon
                  icon={showSidebar ? faAngleLeft : faAngleRight}
                />
              </button>
              <div className="transition-opacity duration-500 ease-in-out opacity-0 group-hover:opacity-100">
                {isSidebarButtonHovered && (
                  <>
                    <div className="absolute -right-4 top-4 h-2 w-2 bg-white shadow-md origin-center rotate-45" />
                    <div className="absolute -right-28 top-[6px] py-1 px-2 rounded-md bg-white shadow-md text-gray-500 text-sm font-medium">
                      {showSidebar ? "Close sidebar" : "Show sidebar"}
                    </div>
                  </>
                )}
              </div>
            </div>
            {currentThreadId !== null && (
              <>
                <h2 className="mb-4 font-bold text-lg">
                  Thread {currentThreadId}
                </h2>
                <form
                  onKeyDown={handleKeyDown}
                  onSubmit={handleSubmit(onSubmit)}
                  className="pb-10"
                >
                  <div className="flex items-center mb-4">
                    <InputLabel
                      htmlFor="title"
                      className="pr-2 whitespace-nowrap"
                      value="Title"
                    />
                    <div className="flex flex-col flex-grow">
                      <TextInput
                        disabled={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).messages[0]?.content.title
                            ? true
                            : false
                        }
                        id="title"
                        type="text"
                        {...register("title", {
                          required: "*Title is required.",
                          validate: isNotBlank("*Blank space are not allowed."),
                        })}
                        value={title}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        onChange={handleInputTitle}
                      />
                      {threads.find((thread) => thread.id === currentThreadId)
                        ?.errors?.title && (
                        <InputError
                          className="mt-1"
                          message={
                            threads.find(
                              (thread) => thread.id === currentThreadId
                            ).errors?.title.message
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="w-full mb-4">
                    {uploadedImages ? (
                      <div className="flex items-center">
                        <button
                          onClick={toggleUploadImage}
                          type="button"
                          className="text-sm px-3 py-1 md-2 text-white rounded bg-gray-500 hover:bg-gray-700"
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                        <InputLabel
                          htmlFor="uploadedImages"
                          className="ml-2 whitespace-nowrap"
                          value="Add Upload Image"
                        />
                        {addUploadImages ? (
                          <InputError
                            className="ml-2"
                            message={addUploadImages}
                          />
                        ) : (
                          ""
                        )}
                      </div>
                    ) : (
                      <div>
                        <h4>Please Upload Image</h4>
                      </div>
                    )}
                    <div className="container mt-4 mx-auto">
                      <Controller
                        control={control}
                        name="uploadedImages"
                        rules={{
                          required: "*Upload image is required.",
                          validate: validatedFileType(
                            "*Please upload an image file (JPG, JPEG, PNG, GIF)"
                          ),
                        }}
                        render={({ field }) => (
                          <ImageUploader
                            imagetype="true"
                            inputId="uploadedImages"
                            inputName="uploadedImages"
                            imageSrc={uploadedImages}
                            handleImageChanges={(event) => {
                              handleImageChange(event);
                              field.onChange(event);
                            }}
                            isMultiple
                            removeUploadedImage={removeUploadedImages}
                            fileInputRef={fileInputRef}
                          />
                        )}
                      />
                      {threads.find((thread) => thread.id === currentThreadId)
                        ?.errors?.uploadedImages && (
                        <InputError
                          className="mt-2"
                          message={
                            threads.find(
                              (thread) => thread.id === currentThreadId
                            ).errors.uploadedImages.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  {uploadedImages ? (
                    <div className="grid grid-cols-1 gap-4 ...">
                      <div className="place-self-center">
                        <button
                          onClick={persistErrorThreads}
                          type="submit"
                          className="mb-4 text-lg px-8 py-1 md-2 text-white rounded bg-blue-500 hover:bg-blue-700"
                        >
                          Generate
                        </button>
                      </div>
                    </div>
                  ) : (
                    ""
                  )}
                </form>

                {currentThreadId !== null && (
                  <div>
                    {threads
                      .find((thread) => thread.id === currentThreadId)
                      ?.messages?.filter(
                        (message) => message.role === "assistant"
                      )
                      .map((message, index) => {
                        const contentArray = message.conten;
                        return (
                          <div key={index} className="container mx-auto mb-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <ImageCard image={contentArray} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
