import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

public class Test {
    public static final String REDIS_API_URL = "https://istwre5gv3.execute-api.us-east-1.amazonaws.com/prod/charge-request-redis";
    public static final String MEMCACHED_API_URL = "https://nysegdlfce.execute-api.us-east-1.amazonaws.com/prod/charge-request-memcached";

    public static void main(String[] args) throws IOException, InterruptedException {
        final var client = HttpClient.newHttpClient();
        var testRequestBody = """
                {
                   "serviceType": "voice",
                   "unit": 2
                 }
                """;
        var testRequest = HttpRequest.newBuilder()
                .uri(URI.create(REDIS_API_URL))
                .POST(HttpRequest.BodyPublishers.ofString(testRequestBody))
                .build();

        IntStream.range(0, 15).parallel().mapToObj(n -> {
                    try {
                        return client.send(testRequest, HttpResponse.BodyHandlers.ofString()).body();
                    } catch (IOException | InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                }
        ).collect(Collectors.toSet());

        var body = client.send(testRequest, HttpResponse.BodyHandlers.ofString()).body();
        System.out.println(body);
        assert body.equalsIgnoreCase("{\"remainingBalance\":20,\"isAuthorized\":true,\"charges\":3}");
    }
}
