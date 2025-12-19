public with sharing class PublishPlatformEvent_Communication {
    public static void Publish_for_chat(List<Communication__c> communications){
        List<Chat_Update_Event__e> chatEventList = new List<Chat_Update_Event__e>();
        for(Communication__c communication: communications){
            Chat_Update_Event__e  chatEvent = new Chat_Update_Event__e();
            chatEvent.SessionId__c = communication.Source_Id__c;
            chatEvent.Message__c = Communication.Content__c;
            chatEvent.RecordId__c = Communication.Id;
            chatEventList.add(chatEvent);
        }
        system.debug('chatEventList: '+chatEventList);
        // Call method to publish events
        List<Database.SaveResult> results = EventBus.publish(chatEventList);
        
        for (Database.SaveResult sr : results) {
            if (sr.isSuccess()) {
                System.debug('Successfully published event.');
            } else {
                for(Database.Error err : sr.getErrors()) {
                    System.debug('Error returned: ' +
                                 err.getStatusCode() +
                                 ' - ' +
                                 err.getMessage());
                }
            }
        }
    }
    public static void Publish_for_call(List<Communication__c> communications){
        
    }
}