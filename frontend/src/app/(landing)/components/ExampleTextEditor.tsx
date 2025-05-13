"use client";

import React from "react";

import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";

import BubbleMenu from "~/features/text-editor/components/BubbleMenu";
import extensions from "~/features/text-editor/extensions";

import "~/features/text-editor/tiptap.css";

const content = `
### Tapez \`/\` pour les commandes...
- Mettez du texte en **gras**, *italique* ou ~~<u>barré</u>~~.
- Intégrez des [liens](https://www.tasklypm.com/), du \`code\`, des citations et des blocs de code.
- Utilisez des raccourcis, collaborez et accomplissez vos tâches.

### Essayez
- [x] Listes de tâches
- [x] @ Mentions
- [ ] et bien plus...

Tout cela dans l'éditeur de texte de SmartProjet.
`;


const ExampleTextEditor = () => {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			...extensions,
			Placeholder.configure({
				placeholder: "Ajoutez une description ou tapez '/' pour les commandes...",
			}),
		],
		content: content,
	});
	return (
		<div className="max-h-[375px] flex-1 overflow-scroll bg-red-800/35 p-4">
			{editor && <BubbleMenu editor={editor} />}
			<EditorContent editor={editor} />
		</div>
	);
};

export default ExampleTextEditor;
