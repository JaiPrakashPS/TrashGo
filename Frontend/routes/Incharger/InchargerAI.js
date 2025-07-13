import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { api } from "./appurl";

const { width, height } = Dimensions.get("window");

const predefinedQuestions = [
  "How many users are active on my street?",
  "What's the work schedule for my labours?",
  "Are there any pending tasks for my labours?",
  "Which streets need attention today?",
];

const Message = ({ text, isUser, timestamp }) => (
  <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.aiMessage]}>
    <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
      <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>{text}</Text>
    </View>
    <Text style={styles.timestamp}>{timestamp}</Text>
  </View>
);

const InchargerAI = ({ route, navigation }) => {
  const { inchargerId } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef(null);
  
  const scrollToBottom = () => {
    if (flatListRef.current) {
      setTimeout(() => {
        flatListRef.current.scrollToEnd({ animated: true });
      }, 200);
    }
  };

  useEffect(() => {
    // Add welcome message when component mounts
    setMessages([
      {
        text: "Hello! I'm your AI assistant. How can I help you today?",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, []);

  const handleQuestionSelect = (question) => {
    addMessage(question, true);
    handleSubmit(question);
  };

  const addMessage = (text, isUser) => {
    const newMessage = {
      text,
      isUser,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMessage]);
    scrollToBottom();
  };

  const handleSubmit = async (customPrompt = null) => {
    const questionText = customPrompt || prompt;
    if (!questionText.trim()) return;
    if (!inchargerId) {
      addMessage("Error: Incharger ID is missing.", false);
      return;
    }

    setLoading(true);
    if (!customPrompt) {
      addMessage(questionText, true);
      setPrompt("");
    }

    try {
      const res = await axios.post(
        `${api}/api/allotWork/gemini`,
        {
          inchargerId,
          prompt: questionText,
        }
      );
      addMessage(res.data.response, false);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to get AI response. Try again.";
      addMessage(errorMessage, false);
    } finally {
      setLoading(false);
    }
  };

  const renderSuggestions = () => (
    <View style={styles.suggestionsContainer}>
      <Text style={styles.suggestionsTitle}>Suggested Questions</Text>
      <FlatList
        data={predefinedQuestions}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.suggestionItem}
            onPress={() => handleQuestionSelect(item)}
          >
            <Text style={styles.suggestionText}>{item}</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => (
          <Message
            text={item.text}
            isUser={item.isUser}
            timestamp={item.timestamp}
          />
        )}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      {renderSuggestions()}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Type your message..."
          placeholderTextColor="#888"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !prompt.trim() && styles.sendButtonDisabled]}
          onPress={() => handleSubmit()}
          disabled={!prompt.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={24} color="#FFF" />
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "#6BBE44",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFF",
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
    alignSelf: "flex-start",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  messageBubble: {
    borderRadius: 20,
    padding: 12,
    maxWidth: "100%",
  },
  userBubble: {
    backgroundColor: "#6BBE44",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#E8F5E9",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: "#FFF",
  },
  aiText: {
    color: "#1F2937",
  },
  timestamp: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 4,
    marginHorizontal: 4,
  },
  suggestionsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FFF",
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
    marginBottom: 8,
  },
  suggestionItem: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  suggestionText: {
    color: "#2E7D32",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: "#1F2937",
  },
  sendButton: {
    backgroundColor: "#6BBE44",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
});

export default InchargerAI;