import {
  Button,
  Dropdown,
  Input,
  Layout,
  Menu,
  Message,
  Modal,
  PageHeader,
  Space,
  Typography,
} from "@arco-design/web-react";
import { IconMenu } from "@arco-design/web-react/icon";
import React, {useEffect} from "react";
import { EmailTemplate, useEditorProps } from "easy-email-pro-editor";
import { mjmlToJson, useEditorContext } from "easy-email-pro-theme";
import { EditorCore, PluginManager } from "easy-email-pro-core";
import mjml from "mjml-browser";
import { saveAs } from "file-saver";
import { Uploader } from "../utils/Uploader";

export const EditorHeader = (props: {
  extra?: React.ReactNode;
  hideImport?: boolean;
  hideExport?: boolean;
}) => {
  const [collapsed, setCollapsed] = React.useState(true);
  const [text, setText] = React.useState("");
  const [visible, setVisible] = React.useState(false);
  const { values, submit, setFieldValue, mergetagsData, dirty } = useEditorContext();
  const { reset } = useEditorContext();

  useEffect(() => {
    console.log(`[useEffect] Dirty: ${dirty}`);
  }, [dirty]);


  const onSave = () => {
    submit();
    console.log(`[onSave] Submit done`);

    reset(values);
    console.log(`[onSave] Reset done`);
    console.log(`[onSave] Dirty: ${dirty}`);
  }

  const onChange = (text: string) => {
    setFieldValue(null, "subject", text);
  };

  const { universalElementSetting } = useEditorProps();

  const onExportImage = async () => {
    Message.loading("Loading...");
    const html2canvas = (await import("html2canvas")).default;
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    const mjmlStr = EditorCore.toMJML({
      element: values.content,
      mode: "production",
      universalElements: universalElementSetting,
    });

    const html = PluginManager.renderWithData(
      mjml(mjmlStr).html,
      mergetagsData
    );

    container.innerHTML = html;
    document.body.appendChild(container);

    const blob = await new Promise<any>((resolve) => {
      html2canvas(container, { useCORS: true }).then((canvas) => {
        return canvas.toBlob(resolve, "png", 0.1);
      });
    });
    saveAs(blob, "demo.png");
    Message.clear();
  };

  const onExportJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(values, null, 2));
    saveAs(
      new Blob([JSON.stringify(values, null, 2)], { type: "application/json" }),
      "easy-email-pro.json"
    );
  };

  const onExportMJML = () => {
    const mjmlStr = EditorCore.toMJML({
      element: values.content,
      mode: "production",
      universalElements: universalElementSetting,
      beautify: true,
    });

    navigator.clipboard.writeText(mjmlStr);
    saveAs(new Blob([mjmlStr], { type: "text/mjml" }), "easy-email-pro.mjml");
  };

  const onExportHTML = () => {
    const mjmlStr = EditorCore.toMJML({
      element: values.content,
      mode: "production",
      universalElements: universalElementSetting,
      beautify: true,
    });

    const html = mjml(mjmlStr).html;
    navigator.clipboard.writeText(html);
    saveAs(new Blob([html], { type: "text/html" }), "easy-email-pro.html");
  };

  const onImportMJML = async () => {
    const uploader = new Uploader(() => Promise.resolve(""), {
      accept: "text/mjml",
      limit: 1,
    });

    const [file] = await uploader.chooseFile();
    const reader = new FileReader();
    const pageData = await new Promise<[string, EmailTemplate["content"]]>(
      (resolve, reject) => {
        reader.onload = function (evt) {
          if (!evt.target) {
            reject();
            return;
          }
          try {
            const pageData = mjmlToJson(evt.target.result as any);
            resolve([file.name, pageData]);
          } catch (error) {
            reject();
          }
        };
        reader.readAsText(file);
      }
    );

    reset({
      subject: pageData[0],
      content: pageData[1],
    });
  };

  const onImportJSON = async () => {
    const uploader = new Uploader(() => Promise.resolve(""), {
      accept: "application/json",
      limit: 1,
    });

    const [file] = await uploader.chooseFile();
    const reader = new FileReader();
    const emailTemplate = await new Promise<EmailTemplate>(
      (resolve, reject) => {
        reader.onload = function (evt) {
          if (!evt.target) {
            reject();
            return;
          }
          try {
            const template = JSON.parse(
              evt.target.result as any
            ) as EmailTemplate;
            resolve(template);
          } catch (error) {
            reject();
          }
        };
        reader.readAsText(file);
      }
    );

    reset({
      subject: emailTemplate.subject,
      content: emailTemplate.content,
    });
  };

  return (
    <>
      <div style={{ position: "relative" }}>
        <PageHeader
          backIcon={<IconMenu />}
          onBack={() => setCollapsed(!collapsed)}
          className="editor-header"
          title={
            <span style={{ color: "var(--color-white)" }}>Easy-email-pro</span>
          }
          style={{
            backgroundColor: "rgb(var(--primary-6))",
            color: "#fff !important",
          }}
          subTitle={
            <div
              style={{
                height: 40,
                position: "absolute",
                minWidth: 300,
                top: 18,
              }}
            >
              <Typography.Title
                heading={5}
                style={{
                  margin: 0,
                  color: "var(--color-white)",
                }}
                editable={{
                  onChange: onChange,
                }}
              >
                {values.subject}
              </Typography.Title>
            </div>
          }
          extra={
            <div style={{ marginRight: 50 }}>
              <Space>
                {props?.extra}
                <div>Dirty: {String(dirty)}</div>
                {!props.hideImport && (
                  <Dropdown
                    droplist={
                      <Menu>
                        <Menu.Item key="MJML" onClick={onImportMJML}>
                          Import from MJML
                        </Menu.Item>

                        <Menu.Item key="JSON" onClick={onImportJSON}>
                          Import from JSON
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <Button>
                      <strong>Import</strong>
                    </Button>
                  </Dropdown>
                )}

                {!props.hideExport && (
                  <Dropdown
                    droplist={
                      <Menu>
                        <Menu.Item key="Export MJML" onClick={onSave}>
                          Save
                        </Menu.Item>
                        <Menu.Item key="Export MJML" onClick={onExportMJML}>
                          Export MJML
                        </Menu.Item>
                        <Menu.Item key="Export HTML" onClick={onExportHTML}>
                          Export HTML
                        </Menu.Item>
                        <Menu.Item key="Export JSON" onClick={onExportJSON}>
                          Export JSON
                        </Menu.Item>
                        <Menu.Item key="Export Image" onClick={onExportImage}>
                          Export Image
                        </Menu.Item>
                      </Menu>
                    }
                  >
                    <Button>
                      <strong>Export</strong>
                    </Button>
                  </Dropdown>
                )}

                <div />
              </Space>
            </div>
          }
        />
      </div>

      <style>{`
      .editor-header .arco-page-header-back { color: var(--color-white); }
      .editor-header .arco-page-header-back:hover:before { background-color: transparent !important; }
      .editor-header .arco-typography-operation-edit { color: var(--color-white); }
      .editor-header .arco-typography-operation-edit { color: var(--color-white);background-color: transparent; }
      `}</style>

      <Modal
        visible={visible}
        title="Import"
        onCancel={() => setVisible(false)}
      >
        <Input.TextArea value={text} onChange={setText} rows={10} />
      </Modal>
    </>
  );
};
