import { useState } from 'react';
import { Chat, type ChatPermissionStatus } from '@renderer/components/ui/Chat';
import { Section, Swatch } from './Section';

export function ChatGallery() {
  const [input, setInput] = useState('');
  const [permissionStatus, setPermissionStatus] = useState<ChatPermissionStatus>('pending');

  return (
    <Section title="Chat" description="Compound component for agent chat surfaces.">
      <Swatch label="">
        <div className="h-128">
          <Chat.Root className="h-full w-xl overflow-hidden rounded-md border border-border">
            <Chat.MessageContainer>
              <Chat.UserMessage>What does this function do?</Chat.UserMessage>
              <Chat.ToolCall>List contents of `src/config`</Chat.ToolCall>
              <Chat.AssistantMessage>
                {[
                  'It reads the config file, validates the schema, and returns the **parsed result**.',
                  '',
                  '| Field | Type |',
                  '| --- | --- |',
                  '| `path` | `string` |',
                  '| `strict` | `boolean` |'
                ].join('\n')}
              </Chat.AssistantMessage>
              <Chat.UserMessage>Can you add error handling and write the file?</Chat.UserMessage>
              <Chat.PermissionRequest
                status={permissionStatus}
                onApprove={() => setPermissionStatus('approved')}
                onDeny={() => setPermissionStatus('denied')}
              >
                Write changes to config.ts
              </Chat.PermissionRequest>
              <Chat.Thinking />
            </Chat.MessageContainer>
            <Chat.Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSend={() => setInput('')}
              placeholder="Ask the agent…"
            />
          </Chat.Root>
        </div>
      </Swatch>
    </Section>
  );
}
