package com.zeus.keyboard.ai;

import android.content.Context;
import android.content.SharedPreferences;
import android.os.Handler;
import android.os.Looper;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

import java.io.IOException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

/**
 * Zeus AI Assistant - Tích hợp AI cho bàn phím.
 * Hỗ trợ gợi ý thông minh, tự động hoàn thành, và trả lời nhanh.
 * Tương thích với OpenRouter, OpenAI, Hermes Gateway.
 */
public class ZeusAIAssistant {

    private static final String PREFS_NAME = "zeus_keyboard_prefs";
    private static final String KEY_API_URL = "ai_api_url";
    private static final String KEY_API_KEY = "ai_api_key";
    private static final String KEY_MODEL = "ai_model";

    private static final String DEFAULT_API_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final String DEFAULT_MODEL = "openai/gpt-4o-mini";

    private final Context mContext;
    private final OkHttpClient mHttpClient;
    private final ExecutorService mExecutor;
    private final Handler mMainHandler;
    private final Gson mGson;

    public ZeusAIAssistant(Context context) {
        mContext = context;
        mHttpClient = new OkHttpClient.Builder()
                .connectTimeout(10, java.util.concurrent.TimeUnit.SECONDS)
                .readTimeout(15, java.util.concurrent.TimeUnit.SECONDS)
                .build();
        mExecutor = Executors.newSingleThreadExecutor();
        mMainHandler = new Handler(Looper.getMainLooper());
        mGson = new Gson();
    }

    /**
     * Gợi ý hoàn thành nhanh dựa trên ngữ cảnh trước con trỏ.
     */
    public void quickComplete(String context, AICallback callback) {
        mExecutor.execute(() -> {
            try {
                SharedPreferences prefs = mContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                String apiUrl = prefs.getString(KEY_API_URL, DEFAULT_API_URL);
                String apiKey = prefs.getString(KEY_API_KEY, "");
                String model = prefs.getString(KEY_MODEL, DEFAULT_MODEL);

                if (apiKey.isEmpty()) {
                    mMainHandler.post(() -> callback.onResult("[Cần cấu hình API Key trong Cài đặt]"));
                    return;
                }

                String response = callAI(apiUrl, apiKey, model, context);
                mMainHandler.post(() -> callback.onResult(response));
            } catch (Exception e) {
                mMainHandler.post(() -> callback.onResult("[Lỗi AI: " + e.getMessage() + "]"));
            }
        });
    }

    private String callAI(String apiUrl, String apiKey, String model, String context) throws IOException {
        JsonObject requestBody = new JsonObject();
        requestBody.addProperty("model", model);
        requestBody.addProperty("max_tokens", 100);
        requestBody.addProperty("temperature", 0.7);

        JsonArray messages = new JsonArray();

        JsonObject systemMsg = new JsonObject();
        systemMsg.addProperty("role", "system");
        systemMsg.addProperty("content",
            "You are a helpful text completion assistant for a Vietnamese keyboard. " +
            "Provide brief, relevant text completions or suggestions. " +
            "Respond with ONLY the completion text, no explanations. " +
            "Support both Vietnamese and English.");
        messages.add(systemMsg);

        JsonObject userMsg = new JsonObject();
        userMsg.addProperty("role", "user");
        String prompt = context.trim();
        if (prompt.isEmpty()) {
            prompt = "Xin chào,";
        }
        userMsg.addProperty("content", prompt);
        messages.add(userMsg);

        requestBody.add("messages", messages);

        RequestBody body = RequestBody.create(
                requestBody.toString(),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(apiUrl)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .addHeader("HTTP-Referer", "https://zeus-keyboard.app")
                .addHeader("X-Title", "Zeus AI Keyboard")
                .post(body)
                .build();

        try (Response response = mHttpClient.newCall(request).execute()) {
            if (!response.isSuccessful()) {
                return "[Lỗi API: " + response.code() + "]";
            }
            String responseBody = response.body().string();
            JsonObject json = mGson.fromJson(responseBody, JsonObject.class);
            JsonArray choices = json.getAsJsonArray("choices");
            if (choices != null && choices.size() > 0) {
                JsonObject firstChoice = choices.get(0).getAsJsonObject();
                JsonObject message = firstChoice.getAsJsonObject("message");
                if (message != null) {
                    String content = message.get("content").getAsString();
                    return content.trim();
                }
            }
            return "[Không có phản hồi từ AI]";
        }
    }

    public interface AICallback {
        void onResult(String response);
    }
}
