public class ConnectlyController {
	@AuraEnabled
    public static String connect(String channel, String sourceId, String content, String Phone){
         
        Communication__c communication = new Communication__c();
        Communication.Medium_of_Communication__c= channel;
        communication.Source_Id__c=sourceId;
        communication.Content__c=content;
        communication.Sid__c=makecallout_for_sms(Phone, content);
        insert communication;
        system.debug('Id: '+communication.Id);
        system.debug('communication: '+communication);
        return communication.Id;
    }
    @AuraEnabled
    public static String makeCall(String sourceId, String Phone){
        Communication__c communication = new Communication__c();
        Communication.Medium_of_Communication__c= 'call';
        communication.Source_Id__c=sourceId;
        //communication.Content__c=content;
        communication.Sid__c=makecallout_for_caliing(Phone);
        insert communication;
        system.debug('Id: '+communication.Id);
        system.debug('communication: '+communication);
        return communication.Id;
    }
    @AuraEnabled(cacheable=true)
    public static List<Communication__c> get_details(String channel, String sourceId){
        system.debug('sourceId: '+sourceId);
        String sourceObject = Id.valueOf(sourceId).getSObjectType().getdescribe().Name;
        return [select Id,Name,Content__c,Status__c,CreatedDate,Medium_of_Communication__c,Is_Inbound__c 
                from Communication__c where Source_Id__c=:sourceId And Medium_of_Communication__c=:channel order by CreatedDate asc];
    }
    public static string makecallout_for_caliing(String Phone){
        String sid='';
        HttpRequest req = new HttpRequest();
        String endpoint = Label.TwilioUrl;
        req.setEndpoint(endpoint);
        req.setMethod('POST');
        req.setHeader('Content-Type','application/x-www-form-urlencoded');
        string username=Label.Twilio_Username;
        String password = Label.Twilio_Password;
		Blob headerValue = Blob.valueOf(username + ':' + password);
		String authorizationHeader = 'BASIC ' + EncodingUtil.base64Encode(headerValue);
		req.setHeader('Authorization', authorizationHeader);
        
        String payload='To='+EncodingUtil.urlEncode('+917979024280', 'UTF-8')+'&From='+EncodingUtil.urlEncode('+13203907456', 'UTF-8')+'&Twiml='+EncodingUtil.urlEncode('<Response><Say>Your code is working Congratulations!</Say></Response>','UTF-8');
		req.setBody(payload);
        
        Http http = new Http();
		HTTPResponse res = http.send(req);
		System.debug(res.getBody());
        if(res.getStatusCode()==200){
            system.debug('Code Succesful');
        }
        else{
            system.debug('Not Successful');
        }
        return sid;
    }
    public Static string makecallout_for_sms(String Phone, String content){
        String sid='';
        return sid;
    }
    @AuraEnabled
    public static String GenerateWithEinteinGenAI(){
        return '';
    }
}