# Chat Dojo MVP - Test Checklist

## 🎯 MVP Success Criteria Testing

Use this checklist to verify all MVP requirements are met. Test with **two devices** (simulator + phone, or two simulators).

---

## Setup Verification

- [ ] Firebase config updated with real credentials
- [ ] Security rules deployed successfully
- [ ] App runs on iOS Simulator without errors
- [ ] App runs on physical device via Expo Go

---

## 1. Authentication (FR1)

### Sign Up

- [ ] Can create account with email and password
- [ ] Display name is saved correctly
- [ ] Invalid email shows error
- [ ] Short password (<6 chars) shows error
- [ ] Duplicate email shows error message
- [ ] After signup, user is automatically signed in

### Sign In

- [ ] Can sign in with existing credentials
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] After sign in, navigates to chat list

### Sign Out

- [ ] Sign out button works
- [ ] Returns to login screen
- [ ] Can sign back in after sign out

---

## 2. Real-time Text Messaging (FR2, FR15)

- [ ] Can create new conversation
- [ ] Text messages send successfully
- [ ] Messages appear instantly on sender device
- [ ] Messages appear in real-time on receiver device (within 500ms)
- [ ] Long messages display correctly
- [ ] Empty messages cannot be sent
- [ ] Multiple rapid messages all deliver correctly
- [ ] Message timestamps are accurate
- [ ] Conversation list updates with last message

---

## 3. Voice Messages (FR3, FR14, FR17)

### Recording

- [ ] Microphone permission requested on first use
- [ ] Can start recording by tapping mic button
- [ ] Recording indicator shows (red dot + timer)
- [ ] Recording duration displays correctly
- [ ] Can cancel recording (X button)
- [ ] Can send recording (send button)

### Playback

- [ ] Voice message appears in chat with play button
- [ ] Can play voice message
- [ ] Can pause during playback
- [ ] Progress bar updates during playback
- [ ] Duration displays correctly
- [ ] Can play multiple voice messages
- [ ] Received voice messages play correctly

---

## 4. Message Persistence (FR4)

- [ ] Send messages on Device A
- [ ] Force-quit app on both devices
- [ ] Reopen app on both devices
- [ ] All messages are still visible
- [ ] Conversation list shows correctly
- [ ] Can send new messages after reopening

---

## 5. Optimistic UI (FR5)

- [ ] Messages appear instantly when sent (no delay)
- [ ] Status shows "sending" → "sent"
- [ ] UI updates before server confirmation
- [ ] Failed sends show error state

---

## 6. Presence Indicators (FR6)

- [ ] Online status visible in conversation
- [ ] Status updates when app backgrounded
- [ ] Status updates when app foregrounded
- [ ] "Last seen" timestamp shows for offline users
- [ ] Real-time updates when other user goes online/offline

---

## 7. Message Status (FR7)

- [ ] Single checkmark (✓) = sent
- [ ] Double checkmark (✓✓) = delivered
- [ ] Blue checkmark = read
- [ ] Status updates in real-time
- [ ] Status visible on own messages only

---

## 8. Typing Indicators (FR8)

- [ ] "Typing..." indicator appears when other user types
- [ ] Indicator disappears after 3 seconds of inactivity
- [ ] Indicator disappears when message sent
- [ ] Works smoothly without lag

---

## 9. In-App Notifications (FR10)

- [ ] Notification banner when message received (app foregrounded)
- [ ] Can tap banner to open conversation
- [ ] Sound/vibration on message receive (if implemented)

---

## 10. Offline Support (FR11, FR12, FR16)

### Offline Message Sending

- [ ] Enable airplane mode on Device A
- [ ] Send text message on Device A
- [ ] Message shows "queued" status
- [ ] Disable airplane mode
- [ ] Message automatically sends
- [ ] Message appears on Device B

### Offline Voice Message

- [ ] Enable airplane mode
- [ ] Record and send voice message
- [ ] Voice queued correctly
- [ ] Reconnect to network
- [ ] Voice message uploads and sends
- [ ] Recipient receives voice message

### Network Interruption

- [ ] Start sending message
- [ ] Disconnect network mid-send
- [ ] Message queues automatically
- [ ] Reconnect network
- [ ] Message sends without duplication

### Offline Reading

- [ ] Load conversations while online
- [ ] Enable airplane mode
- [ ] Can still read all loaded messages
- [ ] Conversation list still visible
- [ ] UI shows offline indicator

---

## 11. Performance (NFR1-NFR5)

- [ ] Message delivery < 500ms (normal network)
- [ ] Voice recording start < 2 seconds
- [ ] App launch < 3 seconds
- [ ] Message list scrolls smoothly (60fps)
- [ ] Offline → online transition seamless
- [ ] Can handle 20+ rapid messages without lag

---

## 12. User Interface

### Chat List Screen

- [ ] Shows all conversations
- [ ] Last message preview visible
- [ ] Timestamps formatted correctly
- [ ] Can navigate to conversation
- [ ] "New Chat" button works
- [ ] Settings button accessible
- [ ] Empty state shows when no chats

### Conversation Screen

- [ ] Messages display chronologically
- [ ] Own messages align right (purple)
- [ ] Other messages align left (gray)
- [ ] Sender names show on received messages
- [ ] Auto-scrolls to bottom for new messages
- [ ] Keyboard doesn't cover input
- [ ] Can switch between text and voice input

### Settings Screen

- [ ] Profile info displays correctly
- [ ] Sign out button accessible
- [ ] Version number shown

---

## 13. Edge Cases

- [ ] Very long messages (500+ chars) display correctly
- [ ] Special characters in messages (emoji, symbols)
- [ ] Messages with only whitespace rejected
- [ ] Voice messages < 1 second
- [ ] Voice messages > 1 minute
- [ ] Network drops during voice upload
- [ ] Multiple conversations work independently
- [ ] Force-quit during message send
- [ ] Background app and return
- [ ] Low memory handling

---

## 14. Error Handling

- [ ] Invalid Firebase config shows clear error
- [ ] Network errors show user-friendly message
- [ ] Permission denied handled gracefully
- [ ] Failed uploads show retry option
- [ ] Authentication errors clear and actionable

---

## 15. Security

- [ ] Users can only see their conversations
- [ ] Cannot access other users' messages
- [ ] Security rules prevent unauthorized access
- [ ] Authentication required for all operations

---

## 🚨 Critical Bugs to Watch For

Common issues during testing:

1. **Messages not syncing**: Check Firebase rules deployed
2. **Voice not recording**: Verify permissions granted
3. **Offline queue not sending**: Check network monitoring
4. **Duplicate messages**: Verify optimistic UI implementation
5. **Memory leaks**: Test with 100+ messages loaded

---

## 📊 Test Scenarios Matrix

| Scenario        | Device A             | Device B | Expected Result                    |
| --------------- | -------------------- | -------- | ---------------------------------- |
| Real-time text  | Send message         | Receive  | Message appears < 500ms            |
| Offline send    | Airplane mode → send | Online   | Message queues, sends on reconnect |
| Voice message   | Record & send        | Receive  | Can play voice                     |
| Force-quit      | Send → quit → reopen | -        | Messages persist                   |
| Rapid messages  | Send 20 quickly      | Receive  | All 20 appear correctly            |
| Offline reading | Airplane mode        | -        | Can read cached messages           |
| Status update   | Read messages        | -        | Blue checkmarks appear             |

---

## ✅ MVP Acceptance Criteria

MVP is **COMPLETE** when:

- [ ] All authentication flows work
- [ ] Text messaging is real-time (both devices)
- [ ] Voice messages record and play
- [ ] Messages persist after force-quit
- [ ] Offline queue works (text and voice)
- [ ] Message status indicators work
- [ ] No critical bugs or crashes
- [ ] App runs on iOS Simulator smoothly
- [ ] Two-user testing passes all scenarios

---

## 📝 Testing Notes

**Date Tested**: \***\*\_\_\_\*\***

**Tester**: \***\*\_\_\_\*\***

**Devices Used**:

- Device A: \***\*\_\_\_\*\***
- Device B: \***\*\_\_\_\*\***

**Critical Issues Found**:

1.
2.
3.

**Minor Issues**:

1.
2.
3.

**Overall Assessment**:

- [ ] MVP READY ✅
- [ ] Needs fixes ⚠️
- [ ] Major issues 🚨

---

## 🎉 Post-Testing

Once all tests pass:

1. Document any workarounds needed
2. Create list of known limitations
3. Plan post-MVP features priority
4. Celebrate! 🎊

**Next Steps**: See `tasks.md` for post-MVP development roadmap
