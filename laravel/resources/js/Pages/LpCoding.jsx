import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useRef, useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faAngleLeft,
  faAngleRight,
  faEdit,
  faTrashCan,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import PrimaryButton from "@/Components/PrimaryButton";
import ImageUploader from "@/Components/ImageUploader";
import InputError from "@/Components/InputError";
import Modal from "@/Components/Modal";
import SecondaryButton from "@/Components/SecondaryButton";
import DangerButton from "@/Components/DangerButton";
import { sortThreadsByDateCategory } from "@/common/lib";

export default function LpCoding({ auth }) {
  const [threads, setThreads] = useState([]);
  const [isSidebarButtonHovered, setIsSidebarButtonHovered] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteThread, setIsDeleteThread] = useState(false);
  const [isEditTitle, setIsEditTitle] = useState(false);
  const [editTitleContent, setEditTitleContent] = useState("");
  const [sortedthreads, setSortedThreads] = useState([]);
  const [addThreads, setAddThreads] = useState(false);
  const editInputRef = useRef(null);
  const fileInputRef = useRef();
  const fileData =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.image ||
    null;
  const textData =
    threads.find((thread) => thread.id === currentThreadId)?.draft?.title || "";

  const scrollContainer = {
    maxHeight: "calc(100vh - 8rem)",
    overflowY: "auto",
  };

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm();
  watch("title");

  const resetFileInputRef = () => {
    errors.title && reset(errors.title);
    errors.uploadedImage && reset(errors.uploadedImage);
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    setIsEditTitle(false);
  };

  const startNewThread = () => {
    if (!addThreads) {
      const newThread = {
        id: Date.now(),
        title: "",
        titleAdded: false,
        draft: { title: "", image: null, errorFile: false },
        errors: [],
      };
      setThreads((prevThreads) => [...prevThreads, newThread]);
      setCurrentThreadId(newThread.id);
      resetFileInputRef();
      setAddThreads(true);
    }
  };

  const selectThread = (threadId) => {
    setCurrentThreadId(threadId);
    resetFileInputRef();
    setEditTitleContent(
      threads.find((thread) => thread.id === threadId)?.title
    );
  };

  const handleImageChange = (event) => {
    const acceptedTypes = ["image/jpeg", "image/png", "image/gif"];
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                draft: {
                  ...thread.draft,
                  image: imageUrl,
                  errorFile: !acceptedTypes.includes(file.type) ? true : false,
                },
              }
            : thread
        )
      );
    }
  };

  const validateImage = () => {
    const invalidFile = threads.find((thread) => thread.id === currentThreadId)
      ?.draft?.errorFile;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, errors } : thread
      )
    );
    if (invalidFile) {
      return "*Please upload an image file (JPG, JPEG, PNG, GIF)";
    } else {
      return undefined;
    }
  };

  const handleTitleChange = (event) => {
    const { name, value } = event.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              draft: {
                ...thread.draft,
                [name]: value,
              },
            }
          : thread
      )
    );
  };

  const onSubmit = (data, event) => {
    const titleAdded = threads.find(
      (thread) => thread.id === currentThreadId
    )?.titleAdded;
    event.preventDefault();
    setIsLoading(true);
    if (!titleAdded) {
      setAddThreads(false);
      setEditTitleContent(data.title.replace(/^\s+/, ""));
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === currentThreadId
            ? {
                ...thread,
                title: data.title.replace(/^\s+/, ""),
                titleAdded: true,
                draft: {
                  ...thread.draft,
                  title: data.title.replace(/^\s+/, ""),
                },
              }
            : thread
        )
      );
    }
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId
          ? {
              ...thread,
              draft: {
                ...thread.draft,
                title: data.title.replace(/^\s+/, ""),
              },
            }
          : thread
      )
    );
    resetFileInputRef();
    setIsLoading(false);
  };

  const handleSaveTitleEdit = (threadId, threadTitle) => {
    if (editTitleContent.trim().length) {
      setThreads((prevThreads) =>
        prevThreads.map((thread) =>
          thread.id === threadId
            ? {
                ...thread,
                title: editTitleContent.replace(/^\s+/, ""),
              }
            : thread
        )
      );
      setEditTitleContent(editTitleContent.replace(/^\s+/, ""));
    } else {
      setEditTitleContent(threadTitle);
    }
    setIsEditTitle(false);
  };

  const onEnterSaveEdit = (e, threadId, threadTitle) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitleEdit(threadId, threadTitle);
    }
  };

  const handleThreadDelete = (threadId) => {
    const threadIndex = threads.findIndex((thread) => thread.id === threadId);
    const updateThreads = threads.filter((thread) => thread.id !== threadId);
    setThreads(updateThreads);
    if (currentThreadId === threadId) {
      const nextThreadIndex = threadIndex === 0 ? 1 : threadIndex - 1;
      setCurrentThreadId(threads[nextThreadIndex]?.id || null);
      fileInputRef.current.value = null;
    }
    setIsDeleteThread(false);
  };

  useEffect(() => {
    if (isEditTitle && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [isEditTitle]);

  useEffect(() => {
    setValue("uploadedImage", fileData);
    setValue("title", textData);
  }, [setValue, fileData, textData]);

  useEffect(() => {
    const getSortedThreads = sortThreadsByDateCategory(threads);
    setSortedThreads(getSortedThreads);
  }, [threads]);

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          LpCoding
        </h2>
      }
    >
      <Head title="LpCoding" />
      <div className="flex ...">
        {showSidebar && (
          <div className="shrink-0 w-full lg:w-72 md:w-60 min-h-screen pl-4 py-4 border-r">
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
            <div className="threadlist-container overflow-y-hidden hover:overflow-y-auto max-h-[calc(80vh-6rem)]">
              {sortedthreads.map((dateCategory) => (
                <div className="mb-2" key={dateCategory.label}>
                  <h1 className="px-2 text-gray-500 text-sm font-semibold">
                    {dateCategory.label}
                  </h1>
                  {dateCategory.threads
                    .sort((a, b) => b.id - a.id)
                    .map((thread) => {
                      const abbreviatedContent =
                        thread.title.length > 30
                          ? `${thread.title.slice(0, 30)}...`
                          : thread.title;
                      return (
                        <div
                          key={thread.id}
                          className={`p-2 border-b border-gray-200 relative ${
                            currentThreadId === thread.id
                              ? "bg-gray-200 rounded-l-sm"
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
                            {currentThreadId === thread.id && thread.title && (
                              <>
                                <div className="absolute right-[40px] w-12 h-4 bg-gradient-to-r from-transparent to-gray-200" />
                                <div className="absolute right-0 flex items-center gap-2 px-2 bg-gray-200">
                                  {isEditTitle ? (
                                    <>
                                      <button
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() =>
                                          handleSaveTitleEdit(
                                            thread.id,
                                            thread.title
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
                                          setIsEditTitle(
                                            (prevState) => !prevState
                                          ),
                                            setEditTitleContent(thread.title);
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
                                        onClick={() =>
                                          setIsEditTitle(
                                            (prevState) => !prevState
                                          )
                                        }
                                      >
                                        <FontAwesomeIcon
                                          className="sm"
                                          icon={faEdit}
                                        />
                                      </button>
                                      <button
                                        onClick={() => setIsDeleteThread(true)}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <FontAwesomeIcon
                                          className="sm"
                                          icon={faTrashCan}
                                        />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          {isEditTitle && currentThreadId === thread.id ? (
                            <input
                              id="ediTitle"
                              type="text"
                              ref={editInputRef}
                              className="w-full h-6 p-1 mt-1 rounded-sm text-gray-500 border border-gray-300 focus:outline-none focus:ring-blue-300"
                              value={editTitleContent}
                              onChange={(e) =>
                                setEditTitleContent(e.target.value)
                              }
                              onKeyDown={(e) =>
                                onEnterSaveEdit(e, thread.id, thread.title)
                              }
                            />
                          ) : (
                            <p className="text-gray-500 truncate">
                              {abbreviatedContent}
                            </p>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          </div>
        )}
        <Modal show={isDeleteThread} maxWidth="sm">
          <div className="text-gray-700 p-4 space-y-4">
            <h1 className="font-bold">Delete thread ?</h1>
            <hr />
            <p>
              This will delete{" "}
              <strong>
                Thread{" "}
                {threads.find((thread) => thread.id === currentThreadId)?.id}
              </strong>
              .
            </p>
            <div className="flex justify-end gap-2">
              <SecondaryButton onClick={() => setIsDeleteThread(false)}>
                Cancel
              </SecondaryButton>
              <DangerButton onClick={() => handleThreadDelete(currentThreadId)}>
                Delete
              </DangerButton>
            </div>
          </div>
        </Modal>
        <div className="flex-1 min-h-screen">
          <div style={scrollContainer} className="p-4">
            <div className="relative group w-fit mb-4">
              <button
                onClick={() => {
                  setShowSidebar(!showSidebar),
                    setIsSidebarButtonHovered(false),
                    setIsEditTitle(false);
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
            {threads.length !== 0 && (
              <>
                <h2 className="mb-4 font-bold text-lg">
                  Thread {currentThreadId}
                </h2>
                <form
                  onSubmit={handleSubmit((data, event) =>
                    onSubmit(data, event)
                  )}
                >
                  <div className="flex flex-col mb-4">
                    <div className="flex items-center">
                      <InputLabel
                        htmlFor="title"
                        className="pr-2 whitespace-nowrap"
                        value="Title"
                      />
                      <TextInput
                        id="title"
                        type="text"
                        {...register("title", {
                          required: "*Please enter title",
                          validate: {
                            noBlankSpaces: (value) => {
                              return (
                                value.trim() !== "" || "*Please enter title"
                              );
                            },
                          },
                        })}
                        value={textData}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        onChange={handleTitleChange}
                      />
                    </div>
                    {threads.find((thread) => thread.id === currentThreadId)
                      ?.errors?.title && (
                      <InputError
                        className="text-red-500 text-sm mt-1 ml-8"
                        message={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).errors.title.message
                        }
                      />
                    )}
                  </div>
                  <Controller
                    control={control}
                    name="uploadedImage"
                    rules={{
                      required: "*Please upload an image",
                      validate: validateImage,
                    }}
                    render={({ field }) => (
                      <ImageUploader
                        inputName="uploadedImage"
                        labelValue="Upload Image"
                        inputId="sample-image"
                        imageSrc={fileData}
                        imagetype="true"
                        handleImageChanges={(e) => {
                          handleImageChange(e);
                          field.onChange(e);
                        }}
                        fileInputRef={fileInputRef}
                        imageStyle={{
                          size: "m-0 w-48 h-auto",
                          imgContainer: "flex flex-col items-center",
                        }}
                      >
                        <PrimaryButton type="submit" className="mt-4">
                          Separate Sections
                        </PrimaryButton>
                      </ImageUploader>
                    )}
                  />
                  {threads.find((thread) => thread.id === currentThreadId)
                    ?.errors?.uploadedImage && (
                    <InputError
                      className={"text-red-500 text-sm mt-[-12px]"}
                      message={
                        threads.find((thread) => thread.id === currentThreadId)
                          .errors.uploadedImage.message
                      }
                    />
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
