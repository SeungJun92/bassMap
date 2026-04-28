export const AI_RECOMMEND_CONFIG = {
    radiusKm: 10,
    targetFish: '배스(Bass)',
    maxRecommendations: 2,
    avoidNoFishing: true,
    includeWildPoints: true,
    noResultMsg: "근처에는 마땅한 추천 장소가 없습니다.",
    // 이 문구는 에지 런타임에서도 사용될 수 있도록 프롬프트에 포함됩니다.
    rules: [
        "입력된 주소 반경 10km 이내의 포인트만 추천할 것",
        "반드시 배스 낚시가 가능한 곳이어야 함",
        "법적으로 낚시가 금지된 구역(낚시 금지구역)은 절대 피할 것",
        "저수지뿐만 아니라 강, 수로, 노지 포인트도 포함 가능",
        "추천 포인트는 최대 2곳으로 제한",
        "사용자가 바로 찾아갈 수 있도록 도로명 주소 또는 지번 주소를 정확하게 제공",
        "조건에 맞는 포인트를 찾기 어려운 경우 억지로 추천하지 말고 지정된 안내 문구 출력"
    ]
};
