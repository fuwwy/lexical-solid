
import type { Doc } from "yjs";

import { useLexicalComposerContext } from "lexical-solid/LexicalComposerContext";
import { JSX, createContext, useContext, Context } from "solid-js";
import {WebsocketProvider} from 'y-websocket';

import {
  useYjsCollaboration,
  useYjsFocusTracking,
  useYjsHistory,
} from "lexical-solid/shared/useYjsCollaboration";

type CollaborationContextType = {
  clientID: number;
  color: string;
  name: string;
  yjsDocMap: Map<string, Doc>;
};

const entries = [
  ["Cat", "255,165,0"],
  ["Dog", "0,200,55"],
  ["Rabbit", "160,0,200"],
  ["Frog", "0,172,200"],
  ["Fox", "197,200,0"],
  ["Hedgehog", "31,200,0"],
  ["Pigeon", "200,0,0"],
  ["Squirrel", "200,0,148"],
  ["Bear", "255,235,0"],
  ["Tiger", "86,255,0"],
  ["Leopard", "0,255,208"],
  ["Zebra", "0,243,255"],
  ["Wolf", "0,102,255"],
  ["Owl", "147,0,255"],
  ["Gull", "255,0,153"],
  ["Squid", "0,220,255"],
];

const randomEntry = entries[Math.floor(Math.random() * entries.length)];

export function CollaborationPlugin({
  id,
  providerFactory,
  shouldBootstrap,
  username,
}: {
  id: string;
  providerFactory: (id: string, yjsDocMap: Map<string, Doc>) => WebsocketProvider;
  shouldBootstrap: boolean;
  username?: string;
}): JSX.Element {
  const collabContext = useCollaborationContext(username);
  const { yjsDocMap, name, color } = collabContext;
  const [editor] = useLexicalComposerContext();
  const provider = providerFactory(id, yjsDocMap);
  const [cursors, binding] = useYjsCollaboration(
    editor,
    id,
    provider,
    yjsDocMap,
    name,
    color,
    shouldBootstrap
  );
  collabContext.clientID = binding.clientID;
  useYjsHistory(editor, binding);
  useYjsFocusTracking(editor, provider, name, color);

  return cursors;
}

export const CollaborationContext: Context<CollaborationContextType> =
  createContext({
    clientID: 0,
    color: randomEntry[1],
    name: randomEntry[0],
    yjsDocMap: new Map(),
  });

export function useCollaborationContext(
  username?: string
): CollaborationContextType {
  const collabContext = useContext(CollaborationContext);
  if (username != null) {
    collabContext.name = username;
  }
  return collabContext;
}
