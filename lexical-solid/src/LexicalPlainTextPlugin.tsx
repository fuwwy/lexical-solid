import {
  createComponent,
  createMemo,
  createSignal,
  JSX,
  onCleanup,
  onMount,
  Show,
} from "solid-js";
import { useLexicalComposerContext } from "./LexicalComposerContext";
import { EditorState, LexicalEditor } from "lexical";
import text, { $canShowPlaceholderCurry } from "@lexical/text";
//@ts-ignore bad typings
import { registerDragonSupport } from "@lexical/dragon";
import plainText from "@lexical/plain-text";
import { mergeRegister } from "@lexical/utils";
import { isServer, Portal } from "solid-js/web";

type InitialEditorStateType = null | string | EditorState | (() => void);

function useLexicalCanShowPlaceholder(editor: LexicalEditor) {
  const [canShowPlaceholder, setCanShowPlaceholder] = createSignal(
    editor.getEditorState().read($canShowPlaceholderCurry(editor.isComposing()))
  );
  onMount(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      const isComposing = editor.isComposing();
      const currentCanShowPlaceholder = editorState.read(
        text.$canShowPlaceholderCurry(isComposing)
      );
      setCanShowPlaceholder(currentCanShowPlaceholder);
    });
  });
  return canShowPlaceholder;
}

function useDecorators(editor: LexicalEditor) {
  const [decorators, setDecorators] = createSignal(
    editor.getDecorators<JSX.Element>()
  ); // Subscribe to changes

  onCleanup(
    editor.registerDecoratorListener((nextDecorators) => {
      setDecorators(nextDecorators);
    })
  ); // Return decorators defined as React Portals

  return createMemo(() => {
    const decoratedPortals = [];
    const decoratorKeys = Object.keys(decorators());

    for (let i = 0; i < decoratorKeys.length; i++) {
      const nodeKey = decoratorKeys[i];
      const decorator = decorators()[nodeKey];
      const element = editor.getElementByKey(nodeKey);

      if (element !== null) {
        decoratedPortals.push(
          createComponent(Portal, { mount: element, children: decorator })
        );
      }
    }

    return decoratedPortals;
  });
}

function usePlainTextSetup(
  editor: LexicalEditor,
  initialEditorState?: InitialEditorStateType
) {
  if (!isServer) {
    onCleanup(
      mergeRegister(
        plainText.registerPlainText(editor, initialEditorState),
        registerDragonSupport(editor)
      ) // We only do this for init
    );  
  }
}

export default function PlainTextPlugin(props: {
  contentEditable: JSX.Element;
  initialEditorState?: InitialEditorStateType;
  placeholder: JSX.Element;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const showPlaceholder = useLexicalCanShowPlaceholder(editor);
  usePlainTextSetup(editor, props.initialEditorState);
  const decorators = useDecorators(editor);
  return (
    <>
      {props.contentEditable}
      <Show when={showPlaceholder()}>{props.placeholder}</Show>
      {decorators()}
    </>
  );
}
