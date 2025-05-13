from rest_framework import serializers

class ClerkWebhookSerializer(serializers.Serializer):
    type = serializers.CharField()
    data = serializers.DictField()
