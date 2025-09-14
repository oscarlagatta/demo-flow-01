import { type Node } from '@xyflow/react';

// Define a custom type for our application's node data, which uses parentId
export type AppNode = Omit<Node, 'parentNode'> & {
  parentId?: string;
};
