import { Editor } from "@tinymce/tinymce-react";

const API_KEY_TINY = import.meta.env.VITE_API_KEY_TINY;

interface CustomEditorProps {
  value: string;
  setLoadingInit: (loading: boolean) => void;
  handleOnchange: (content: string, option?: unknown) => void;
  height?: number;
  option?: unknown;
}

const CustomEditor = ({
  value,
  setLoadingInit,
  handleOnchange,
  height,
  ...res
}: CustomEditorProps) => {
  const { option } = res;
  return (
    <Editor
      apiKey={API_KEY_TINY}
      onInit={() => {
        setLoadingInit(false);
      }}
      value={value}
      onEditorChange={(content) => {
        handleOnchange(content, option);
      }}
      init={{
        height: height || 200,
        resize: true,
        menubar: false,
        branding: false,
        statusbar: false,
        toolbar:
          "undo redo | styles | fontselect fontsizeselect | bold italic underline strikethrough forecolor backcolor | " +
          "image | alignleft aligncenter alignright alignjustify | outdent indent | " +
          "bullist numlist | table | " +
          "help",
        plugins: [
          "advlist",
          "lists",
          "link",
          "image",
          "table",
          "help",
          "code",
          "preview",
        ],
        paste_data_images: true,
        automatic_uploads: false,
        images_upload_handler: (
          blobInfo: { base64: () => string; blob: () => Blob },
          success: (url: string) => void,
        ) => {
          const base64 = blobInfo.base64();
          const mime = blobInfo.blob().type;
          const dataUrl = `data:${mime};base64,${base64}`;
          success(dataUrl);
        },
      }}
    />
  );
};
export default CustomEditor;
