import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForm, Controller } from "react-hook-form";
import {
  faPlus,
  faCheck,
  faTimes,
  faTrashCan,
  faEdit,
  faAngleLeft,
  faAngleRight,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import PrimaryButton from "@/Components/PrimaryButton";
import ImageUploader from "@/Components/ImageUploader";
import Modal from "@/Components/Modal";
import DangerButton from "@/Components/DangerButton";
import SecondaryButton from "@/Components/SecondaryButton";
import { sortThreadsByDateCategory } from "@/common/lib";
import Image from "@/Components/Image";

export default function Banner({ auth }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isSidebarButtonHovered, setIsSidebarButtonHovered] = useState(false);
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editInput, setEditInput] = useState(false);
  const [updateTitles, setUpdateTitles] = useState("");
  const [deleteThread, setDeleteThread] = useState(false);
  const [sortedthreads, setSortedThreads] = useState([]);
  const [addThreads, setAddThreads] = useState(false);
  const currentThread = threads.find((thread) => thread.id === currentThreadId);
  const inputTitle = currentThread?.title || "";
  const inputText1 = currentThread?.text1 || "";
  const inputText2 = currentThread?.text2 || "";
  const inputText3 = currentThread?.text3 || "";
  const uploadBackgroundImages = currentThread?.backgroundImage || null;
  const uploadSampleImages = currentThread?.sampleImage || null;

  const scrollableContainer = {
    maxHeight: "calc(100vh - 8rem)",
    overflowY: "auto",
  };

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
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

  const handleDeleteThread = (threadId) => {
    const threadIndex = threads.findIndex((thread) => thread.id === threadId);
    if (threadIndex !== -1) {
      setThreads((prevThreads) =>
        prevThreads.filter((thread) => thread.id !== threadId)
      );
      if (currentThreadId === threadId) {
        const nextThreadIndex = threadIndex === 0 ? 1 : threadIndex - 1;
        setCurrentThreadId(threads[nextThreadIndex]?.id || null);
      }
      setDeleteThread(false);
    }
  };

  const handleSaveTitleUpdate = (threadId) => {
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === threadId
          ? { ...thread, threadTitle: updateTitles }
          : thread
      )
    );
    setEditInput(false);
  };

  const selectThread = (threadId) => {
    reset();
    setCurrentThreadId(threadId);
  };

  const handleInputsChange = (event) => {
    const { name, value } = event.target;
    setThreads((prevThreads) =>
      prevThreads.map((thread) =>
        thread.id === currentThreadId ? { ...thread, [name]: value } : thread
      )
    );
  };

  const handleImageChanges = (event) => {
    const { name, files } = event.target;

    if (files && files.length > 0) {
      if (files[0].type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(files[0]);
        setThreads((prevThreads) =>
          prevThreads.map((thread) =>
            thread.id === currentThreadId
              ? { ...thread, [name]: imageUrl }
              : thread
          )
        );
      }
    }
    return null;
  };

  const validatedFileType = (message) => (value) => {
    const acceptedExtensions = ["mp4", "webm", "mov"];
    const fileExtension = value.split(".").pop().toLowerCase();
    const uploadFile = acceptedExtensions.includes(fileExtension);
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

  const onSubmit = async (data) => {
    setIsLoading(true);
    const newThreads = threads.map((thread) => {
      thread.id === currentThreadId
        ? setAddThreads(false)
        : setAddThreads(true);
      if (thread.id === currentThreadId) {
        thread.messages.push({
          role: "user",
          created: new Date(),
          title: data.title,
          text1: data.text1,
          text2: data.text2,
          text3: data.text3,
          backgroundImage: data.backgroundImage,
          sampleImage: data.sampleImage,
          generateImage:
            thread.backgroundImage &&
            new Array(10).fill(thread.backgroundImage),
        });
        thread;
      }
      return thread;
    });
    setThreads(newThreads);
    generatedImages(
      newThreads.find((thread) => thread.id === currentThreadId)?.messages
    );
    setIsLoading(false);
  };

  useEffect(() => {
    setUpdateTitles(currentThread?.threadTitle || "");
    setEditInput(false);
    setValue("backgroundImage", uploadBackgroundImages);
    setValue("sampleImage", uploadSampleImages);

    const getSortedThreads = sortThreadsByDateCategory(threads);
    setSortedThreads(getSortedThreads);
  }, [uploadBackgroundImages, uploadSampleImages, currentThreadId, threads]);

  const generatedImages = (threadMessages) => {
    const imagesFiles =
      threadMessages[threadMessages.length - 1]?.generateImage;

    setThreads((threads) =>
      threads.map((thread) => {
        if (thread.id === currentThreadId) {
          thread.messages.push({ role: "assistant", images: imagesFiles });
        }
        return thread;
      })
    );
  };

  return (
    <AuthenticatedLayout
      user={auth.user}
      header={
        <h2 className="font-semibold text-xl text-gray-800 leading-tight">
          Banner
        </h2>
      }
    >
      <Head title="Banner" />
      <div className="flex ...">
        {showSidebar && (
          <div className="shrink-0 w-full lg:w-72 md:w-72 min-h-screen pl-4 py-4 border-r">
            <div className="flex items-start">
              <button
                onClick={startNewThread}
                className="mb-4 py-2 px-4 bg-gray-500 text-white rounded hover:bg-gray-700"
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <button
                className="lg:hidden md:hidden ml-60  px-4 bg-gray-500 text-white rounded hover:bg-gray-700 "
                onClick={() => setShowSidebar(!showSidebar)}
              >
                <FontAwesomeIcon icon={faAngleLeft} />
              </button>
            </div>
            <div className="threadlist-container overflow-y-hidden hover:overflow-y-auto max-h-[calc(100vh-6rem)]">
              {sortedthreads.map((dateCategory) => (
                <div className="mb-2" key={dateCategory.label}>
                  <h1 className="px-2 text-gray-500 text-sm font-semibold">
                    {dateCategory.label}
                  </h1>
                  {dateCategory.threads
                    .sort((a, b) => b.id - a.id)
                    .map((thread) => {
                      const contentTitle = (
                        thread.messages[0]?.title || ""
                      ).slice(0, 30);
                      return (
                        <div
                          key={thread.id}
                          onClick={() => selectThread(thread.id)}
                          className={`p-2 cursor-pointer border-b border-gray-200 relative ${
                            currentThreadId === thread.id
                              ? "bg-gray-300 rounded-l-md p-2"
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
                            {contentTitle && currentThreadId === thread.id && (
                              <>
                                <div className="absolute right right-[40px] w-12 bg-gradient-to-r from-transparent to-gray-200" />
                                <div className="absolute right-0 flex items-center gap-2 px-4 mr-4">
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
                                            thread.threadTitle || contentTitle
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
                                            thread.threadTitle || contentTitle
                                          );
                                        }}
                                      >
                                        <FontAwesomeIcon
                                          size="sm"
                                          icon={faEdit}
                                        />
                                      </button>
                                      <button
                                        className="text-gray-500 hover:text-gray-700"
                                        onClick={() => setDeleteThread(true)}
                                      >
                                        <FontAwesomeIcon
                                          size="sm"
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
                              className="w-full h-6 p-1 mt-1 rounded-sm text-gray-500 border border-gray-300"
                            />
                          ) : (
                            <p className="text-gray-500 truncate">
                              {thread.threadTitle || contentTitle}
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
        <Modal show={deleteThread} maxWidth="sm">
          <div className="text-gray-700 p-4 space-y-4">
            <h1 className="mt-2 text-lg font-bold">Delete thread?</h1>
            <hr />
            <p>
              this will delete <strong>{currentThread?.title}.</strong>
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
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="flex items-center">
                    <InputLabel
                      htmlFor="title"
                      className="pr-2 whitespace-nowrap"
                      value="Title:"
                    />
                    <div className="flex flex-col flex-grow">
                      <TextInput
                        disabled={
                          threads.find(
                            (thread) => thread.id === currentThreadId
                          ).messages[0]?.draft?.title
                            ? true
                            : false
                        }
                        id="title"
                        type="text"
                        name="title"
                        {...register("title", {
                          required: "*Title is required.",
                          validate: isNotBlank("*Blank space are not allowed."),
                        })}
                        value={inputTitle}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        onChange={handleInputsChange}
                      />
                      {currentThread?.errors?.title && (
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
                    <InputLabel
                      htmlFor="backgroundImage"
                      className="pr-2 mt-4 whitespace-nowrap"
                      value="Upload Background Image"
                    />
                    <div className="container mx-auto">
                      <Controller
                        control={control}
                        name="backgroundImage"
                        rules={{
                          required: "*Background image is required.",
                          validate: validatedFileType(
                            "*Please upload an image file (JPG, JPEG, PNG, GIF)"
                          ),
                        }}
                        render={({ field }) => (
                          <ImageUploader
                            imagetype="true"
                            inputId="backgroundImage"
                            inputName="backgroundImage"
                            imageSrc={uploadBackgroundImages}
                            handleImageChanges={(event) => {
                              handleImageChanges(event);
                              field.onChange(event);
                            }}
                            imageStyle={{
                              size: "w-48 j-auto",
                              imageContainer: "flex items-center",
                            }}
                          />
                        )}
                      />
                      {currentThread?.errors?.backgroundImage && (
                        <InputError
                          className="mt-2"
                          message={
                            threads.find(
                              (thread) => thread.id === currentThreadId
                            ).errors.backgroundImage.message
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="w-full mb-4">
                    <InputLabel
                      htmlFor="sampleImage"
                      className="pr-2 whitespace-nowrap"
                      value="Upload Sample Image"
                    />
                    <div className="container mx-auto">
                      <Controller
                        control={control}
                        name="sampleImage"
                        rules={{
                          required: "*Sample image is required.",
                          validate: validatedFileType(
                            "*Please upload an image file (JPG, JPEG, PNG, GIF)"
                          ),
                        }}
                        render={({ field }) => (
                          <ImageUploader
                            imagetype="true"
                            inputId="sampleImage"
                            inputName="sampleImage"
                            imageSrc={uploadSampleImages}
                            handleImageChanges={(event) => {
                              handleImageChanges(event);
                              field.onChange(event);
                            }}
                            imageStyle={{
                              size: "m-0 w-48 j-auto",
                              imageContainer: "flex items-center",
                            }}
                          />
                        )}
                      />
                      {currentThread?.errors?.sampleImage && (
                        <InputError
                          className="mt-2"
                          message={
                            threads.find(
                              (thread) => thread.id === currentThreadId
                            ).errors.sampleImage.message
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <InputLabel
                      htmlFor="text1"
                      className="pr-2 whitespace-nowrap"
                      value="Text 1:"
                    />
                    <div className="w-full md-4">
                      <TextInput
                        id="text1"
                        type="text"
                        name="text1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        {...register("text1", {
                          required: "Text1 is required.",
                          validate: isNotBlank("*Blank space are not allowed."),
                        })}
                        value={inputText1}
                        onChange={handleInputsChange}
                      />
                      {currentThread?.errors?.text1 && (
                        <InputError
                          className="mt-1"
                          message={
                            threads.find(
                              (thread) => thread.id === currentThreadId
                            ).errors?.text1.message
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <InputLabel
                      htmlFor="text2"
                      className="pr-2 whitespace-nowrap"
                      value="Text 2:"
                    />
                    <div className="w-full md-4">
                      <TextInput
                        id="text2"
                        type="text"
                        name="text2"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        {...register("text2", {
                          required: "Text2 is required.",
                          validate: isNotBlank("*Blank space are not allowed."),
                        })}
                        value={inputText2}
                        onChange={handleInputsChange}
                      />
                      {currentThread?.errors?.text2 && (
                        <InputError
                          className="mt-1"
                          message={
                            threads.find(
                              (thread) => thread.id === currentThreadId
                            ).errors?.text2.message
                          }
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center mb-4">
                    <InputLabel
                      htmlFor="text3"
                      className="pr-2 whitespace-nowrap"
                      value="Text 3:"
                    />
                    <div className="w-full md-4">
                      <TextInput
                        id="text3"
                        type="text"
                        name="text3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        {...register("text3", {
                          required: "Text3 is required.",
                          validate: isNotBlank("*Blank space are not allowed."),
                        })}
                        value={inputText3}
                        onChange={handleInputsChange}
                      />
                      {currentThread.errors?.text3 && (
                        <InputError
                          className="mt-1"
                          message={
                            threads.find(
                              (thread) => thread.id === currentThreadId
                            ).errors?.text3.message
                          }
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center">
                    <PrimaryButton
                      onClick={persistErrorThreads}
                      type="submit"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <FontAwesomeIcon
                          className="animate-spin h-5 mr-2 text-white"
                          viewBox="0 0 24 24"
                          icon={faSpinner}
                        />
                      ) : (
                        ""
                      )}
                      Generate
                    </PrimaryButton>
                  </div>
                </form>
                {currentThreadId !== null && (
                  <div className="mx-auto mt-4">
                    <div className="grid md:grid-cols-2 gap-5">
                      {threads
                        .find((thread) => thread.id === currentThreadId)
                        ?.messages?.filter(
                          (message) => message.role === "assistant"
                        )
                        .map((message, key) => {
                          return (
                            <Image
                              className="mt-2"
                              key={key}
                              imageSrc={message.images[0]}
                            />
                          );
                        })}
                    </div>
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
