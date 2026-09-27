package com.zeus.keyboard.ui;

import java.util.HashMap;
import java.util.Map;

/**
 * Vietnamese Telex Input Processor
 * Xử lý gõ tiếng Việt theo kiểu Telex.
 *
 * Quy tắc Telex:
 * - aa → â, oo → ô, ee → ê
 * - s → sắc, f → huyền, r → hỏi, x → ngã, j → nặng
 * - w → ư, ơ, hoặc ă (tùy ngữ cảnh)
 * - dd → đ
 */
public class VietnameseProcessor {

    // Vowel + tone combinations
    private static final Map<String, String> CIRCUMFLEX_MAP = new HashMap<>();
    private static final Map<Character, String> TONE_MAP = new HashMap<>();
    private static final Map<String, String> HORN_MAP = new HashMap<>();

    static {
        // Circumflex: aa->â, oo->ô, ee->ê
        CIRCUMFLEX_MAP.put("aa", "â");
        CIRCUMFLEX_MAP.put("oo", "ô");
        CIRCUMFLEX_MAP.put("ee", "ê");

        // Tone marks: s=sắc, f=huyền, r=hỏi, x=ngã, j=nặng
        TONE_MAP.put('s', "sắc");
        TONE_MAP.put('f', "huyền");
        TONE_MAP.put('r', "hỏi");
        TONE_MAP.put('x', "ngã");
        TONE_MAP.put('j', "nặng");

        // Horn: w transformations
        HORN_MAP.put("uw", "ư");
        HORN_MAP.put("ow", "ơ");
        HORN_MAP.put("aw", "ă");
    }

    // Complete Vietnamese vowel table with tones
    private static final String[][] TONE_VOWELS = {
        // không dấu, sắc, huyền, hỏi, ngã, nặng
        {"a", "á", "à", "ả", "ã", "ạ"},
        {"ă", "ắ", "ằ", "ẳ", "ẵ", "ặ"},
        {"â", "ấ", "ầ", "ẩ", "ẫ", "ậ"},
        {"e", "é", "è", "ẻ", "ẽ", "ẹ"},
        {"ê", "ế", "ề", "ể", "ễ", "ệ"},
        {"i", "í", "ì", "ỉ", "ĩ", "ị"},
        {"o", "ó", "ò", "ỏ", "õ", "ọ"},
        {"ô", "ố", "ồ", "ổ", "ỗ", "ộ"},
        {"ơ", "ớ", "ờ", "ở", "ỡ", "ợ"},
        {"u", "ú", "ù", "ủ", "ũ", "ụ"},
        {"ư", "ứ", "ừ", "ử", "ữ", "ự"},
        {"y", "ý", "ỳ", "ỷ", "ỹ", "ỵ"},
    };

    /**
     * Xử lý chuỗi theo quy tắc Telex.
     */
    public String processTelex(String input) {
        if (input == null || input.isEmpty()) return "";

        String result = input.toLowerCase();

        // Step 1: Double letter transformations
        result = applyDoubleLetters(result);

        // Step 2: Tone marks
        result = applyTones(result);

        return result;
    }

    private String applyDoubleLetters(String input) {
        // dd -> đ
        if (input.endsWith("dd")) {
            return input.substring(0, input.length() - 2) + "đ";
        }

        // Check for circumflex patterns at end
        if (input.endsWith("aa")) {
            return input.substring(0, input.length() - 2) + "â";
        }
        if (input.endsWith("oo")) {
            return input.substring(0, input.length() - 2) + "ô";
        }
        if (input.endsWith("ee")) {
            return input.substring(0, input.length() - 2) + "ê";
        }

        // Check for horn patterns
        if (input.endsWith("uw")) {
            return input.substring(0, input.length() - 2) + "ư";
        }
        if (input.endsWith("ow")) {
            return input.substring(0, input.length() - 2) + "ơ";
        }
        if (input.endsWith("aw")) {
            return input.substring(0, input.length() - 2) + "ă";
        }
        if (input.endsWith("w") && input.length() > 1) {
            // w standalone -> ư (if previous char is consonant-compatible)
            char prev = input.charAt(input.length() - 2);
            if (prev == 'u' || prev == 'ư') {
                return input.substring(0, input.length() - 2) + "ư";
            }
        }

        // Step 3: Tone marks (s, f, r, x, j at end of word)
        if (input.length() >= 2) {
            char lastChar = input.charAt(input.length() - 1);
            String toneType = getToneType(lastChar);

            if (toneType != null && isVowel(input.charAt(input.length() - 2))) {
                String vowelStr = String.valueOf(input.charAt(input.length() - 2));
                String toned = applyToneToVowel(vowelStr, toneType);
                return input.substring(0, input.length() - 2) + toned;
            }
        }

        return input;
    }

    private String applyTones(String input) {
        // Already applied in applyDoubleLetters
        return input;
    }

    private String getToneType(char c) {
        if (c == 's') return "sắc";
        if (c == 'f') return "huyền";
        if (c == 'r') return "hỏi";
        if (c == 'x') return "ngã";
        if (c == 'j') return "nặng";
        return null;
    }

    private boolean isVowel(char c) {
        String vowels = "aăâeêioôơuưy";
        return vowels.indexOf(Character.toLowerCase(c)) >= 0;
    }

    private String applyToneToVowel(String vowel, String toneType) {
        int toneIndex = getToneIndex(toneType);
        if (toneIndex < 0) return vowel;

        for (String[] row : TONE_VOWELS) {
            if (row[0].equals(vowel) || row[1].equals(vowel) ||
                row[2].equals(vowel) || row[3].equals(vowel) ||
                row[4].equals(vowel) || row[5].equals(vowel)) {
                return row[toneIndex];
            }
        }
        return vowel;
    }

    private int getToneIndex(String toneType) {
        switch (toneType) {
            case "không dấu": return 0;
            case "sắc": return 1;
            case "huyền": return 2;
            case "hỏi": return 3;
            case "ngã": return 4;
            case "nặng": return 5;
            default: return -1;
        }
    }

    /**
     * Kiểm tra xem từ đã hoàn chỉnh chưa (không còn ký tự Telex chờ).
     */
    public boolean isCompleteWord(String word) {
        if (word == null || word.isEmpty()) return false;
        char lastChar = word.charAt(word.length() - 1);
        // Complete if last char is not a Telex control char
        return "sfjrxaow".indexOf(lastChar) < 0;
    }
}
