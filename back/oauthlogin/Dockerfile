# 1. 사용할 기본 이미지 (JDK 17 버전)
FROM openjdk:17-jdk-slim

# 2. Git 설치
RUN apt-get update && apt-get install -y git

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 현재 디렉토리의 JAR 파일을 컨테이너 내부로 복사
# 코드 고치고 다시 재빌드 할때마다 실행됨
COPY  build/libs/oauthlogin-0.0.1-SNAPSHOT.jar app.jar

# 4. 컨테이너가 실행될 때 실행할 명령어
CMD ["java", "-jar", "app.jar"]

# 5. 컨테이너에서 사용할 포트
EXPOSE 8080
