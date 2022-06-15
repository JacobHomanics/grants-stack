import { useEffect, useState } from "react";
import { shallowEqual, useSelector, useDispatch } from "react-redux";
import { TextArea, TextInput, WebsiteInput } from "../grants/inputs";
import { RootState } from "../../reducers";
import { fetchGrantData } from "../../actions/grantsMetadata";
import Button, { ButtonVariants } from "./Button";
import { saveFileToIPFS, resetFileStatus } from "../../actions/ipfs";
import { publishGrant, resetTXStatus } from "../../actions/newGrant";
import Toast from "./Toast";
import TXLoading from "./TXLoading";

function ProjectForm({ currentGrantId }: { currentGrantId?: string }) {
  const dispatch = useDispatch();
  const props = useSelector((state: RootState) => {
    const grantMetadata = state.grantsMetadata[Number(currentGrantId)];
    return {
      id: currentGrantId,
      loading: grantMetadata ? grantMetadata.loading : false,
      currentGrant: grantMetadata?.metadata,
      ipfsInitialized: state.ipfs.initialized,
      ipfsInitializationError: state.ipfs.initializationError,
      savingFile: state.ipfs.ipfsSavingFile,
      projectFile: state.ipfs.projectFileSavedCID,
      projectImg: state.ipfs.projectImgSavedCID,
      txStatus: state.newGrant.txStatus,
    };
  }, shallowEqual);

  // if currentGrantId is undefined, the form is empty so it's not valid
  const [validated, setValidated] = useState(currentGrantId !== undefined);
  const [formInputs, setFormInputs] = useState({
    title: "",
    description: "",
    website: "",
    challenges: "",
    roadmap: "",
  });

  const [show, showToast] = useState(false);

  const resetStatus = () => {
    dispatch(resetTXStatus());
    dispatch(resetFileStatus());
  };
  const [imgError, setImgError] = useState(false);
  const [projectImg, setProjectImg] = useState<Buffer | undefined>();

  const publishProject = async () => {
    if (projectImg) {
      await dispatch(saveFileToIPFS("test.txt", projectImg, FileTypes.IMG));
    }

    await dispatch(saveFileToIPFS("test.txt", formInputs, FileTypes.PROJECT));
    dispatch(publishGrant(currentGrantId));
  };

  const handleInput = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    setFormInputs({ ...formInputs, [e.target.name]: value });
  };

  const validateImg = (image: any) => {
    const width = image?.path[0].naturalWidth;
    const height = image?.path[0].naturalHeight;
    const aspectRatio = width / height;
    // require aspect ratio of roughly 3:1
    const error = aspectRatio < 2 || aspectRatio > 4;
    // always set error so that user can correct image and validation passes
    setImgError(error);
  };

  const saveImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.currentTarget;
    if (files) {
      if (files.length === 0) {
        return;
      }
      const img: HTMLImageElement = document.createElement("img");
      img.onload = validateImg;
      img.src = URL.createObjectURL(files[0]);

      if (!imgError) {
        const reader = new FileReader();
        reader.onloadend = function () {
          const bufferResult = reader.result as ArrayBuffer;
          if (bufferResult) {
            const buf = window.Buffer.from(bufferResult);
            setProjectImg(buf);
          }
        };

        reader.readAsArrayBuffer(files[0]);
      }
    }
  };

  // TODO: feels like this could be extracted to a component
  useEffect(() => {
    // called twice
    // 1 - when it loads or id changes (it checks if it's cached in local storage)
    // 2 - when ipfs is initialized (it fetches it if not loaded yet)
    if (currentGrantId !== undefined && props.currentGrant === undefined) {
      dispatch(fetchGrantData(Number(currentGrantId)));
    }

    const { currentGrant } = props;

    if (currentGrant) {
      setFormInputs({
        title: currentGrant.title,
        description: currentGrant.description,
        website: currentGrant.website,
        challenges: currentGrant.challenges,
        roadmap: currentGrant.roadmap,
      });
    }
  }, [dispatch, props.ipfsInitialized, currentGrantId, props.currentGrant]);

  // perform validation after the fields state is updated
  useEffect(() => {
    const validValues = Object.values(formInputs).filter((input) => {
      if (typeof input === "string") {
        return input.length > 0;
      }

      return false;
    });

    setValidated(validValues.length === Object.keys(formInputs).length);
  }, [formInputs]);

  // eslint-disable-next-line
  useEffect(() => {
    return () => {
      resetStatus();
    };
  }, []);

  if (props.currentGrant === undefined && props.ipfsInitializationError) {
    return <>Error initializing IPFS. Reload the page and try again.</>;
  }

  if (
    currentGrantId !== undefined &&
    props.currentGrant === undefined &&
    !props.ipfsInitialized
  ) {
    return <>Initializing ipfs...</>;
  }

  if (
    // if it's undefined we don't have anything to load
    currentGrantId !== undefined &&
    props.currentGrant === undefined &&
    props.loading &&
    props.currentGrant === undefined
  ) {
    return <>Loading grant data from IPFS... </>;
  }

  return (
    <div className="border-0 sm:border sm:border-solid border-tertiary-text rounded text-primary-text p-0 sm:p-4">
      <form onSubmit={(e) => e.preventDefault()}>
        <TextInput
          label="Project Name"
          name="title"
          placeholder="What's the project name?"
          value={formInputs.title}
          changeHandler={(e) => handleInput(e)}
        />
        <WebsiteInput
          label="Project Website"
          name="website"
          value={formInputs.website}
          changeHandler={(e) => handleInput(e)}
        />
        <ImageInput label="Project Logo" imgHandler={(e) => saveImage(e)} />
        {imgError && (
          <span className="text-danger-text">
            Image needs to have an aspect ratio of roughly (3:1)
          </span>
        )}
        <TextArea
          label="Project Description"
          name="description"
          placeholder="What is the project about and what kind of impact does it aim to have?"
          value={formInputs.description}
          changeHandler={(e) => handleInput(e)}
        />
        <TextArea
          label="Project Roadmap"
          name="roadmap"
          placeholder="What are the dependencies and project goals? What are the timelines per milestone or deliverable?"
          value={formInputs.roadmap}
          changeHandler={(e) => handleInput(e)}
        />
        <TextArea
          label="Project Challenges"
          name="challenges"
          placeholder="What are some of the risks you see ahead? How do you plan to prepare?"
          value={formInputs.challenges}
          changeHandler={(e) => handleInput(e)}
        />
        <div className="flex w-full justify-end mt-6">
          <Button
            disabled={!validated || !props.ipfsInitialized}
            variant={ButtonVariants.primary}
            onClick={publishProject}
          >
            {props.ipfsInitialized ? "Save & Publish" : "Initializing IPFS..."}
          </Button>
        </div>
      </form>
      <Toast
        show={show}
        onClose={() => showToast(false)}
        error={props.txStatus === "error"}
      >
        <TXLoading status={props.txStatus} />
      </Toast>
    </div>
  );
}

export default ProjectForm;
